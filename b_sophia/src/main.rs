use std::{env, fs, io, process};
use std::io::Write;
use std::str::FromStr;

extern crate regex;
use regex::Regex;

extern crate time;
use time::OffsetDateTime;

extern crate bjdatasets;
use bjdatasets::fulldataset::FullIndexDataset;
use bjdatasets::treeddataset::TreedDataset;

extern crate sophia;
use sophia::dataset::*;
use sophia::dataset::inmem::*;
use sophia::ns::rdf;
use sophia::parser::nq;
use sophia::quad::stream::*;
use sophia::term::Term;
use sophia::term::BoxTerm;
use std::rc::Rc;

type ArryDataset = Vec<([BoxTerm; 3], Option<BoxTerm>)>;

fn get_vmsize() -> usize {
    let status = fs::read_to_string("/proc/self/status").unwrap();
    let vmsize_re = Regex::new(r"VmSize:\s*([0-9]+) kB").unwrap();
    let vmsize = vmsize_re.captures(&status).unwrap().get(1).unwrap().as_str();
    usize::from_str(vmsize).unwrap()
}

fn task_query<R> (f: R, variant: Option<&str>, query_num: usize) where
    R: io::BufRead,
{
    if query_num == 1 {
        eprintln!("task    : query");
    } else {
        eprintln!("task    : query{}", query_num);
    }

    match variant {
        Some("fast")        => task_query_g(f, || FastDataset::new()     , |_, _, _, _| FastDataset::new()             , query_num),
        Some("light")       => task_query_g(f, || LightDataset::new()    , |_, _, _, _| LightDataset::new()            , query_num),
        Some("tree")        => task_query_g(f, || TreedDataset::new()    , |_, _, _, _| TreedDataset::new()            , query_num),
        Some("tree_anti")   => task_query_g(f, || TreedDataset::new()    , |a, b, c, d| TreedDataset::new_anti(a,b,c,d), query_num),
        Some("full")        => task_query_g(f, || FullIndexDataset::new(), |_, _, _, _| FullIndexDataset::new()        , query_num),
        Some("array")       => task_query_g(f, || ArryDataset::new()     , |_, _, _, _| ArryDataset::new()             , query_num),
        Some("fast_array")  => task_query_g(f, || FastDataset::new()     , |_, _, _, _| ArryDataset::new()             , query_num),
        Some("light_array") => task_query_g(f, || LightDataset::new()    , |_, _, _, _| ArryDataset::new()             , query_num),
        Some("tree_array")  => task_query_g(f, || TreedDataset::new()    , |_, _, _, _| ArryDataset::new()             , query_num),
        Some("full_array")  => task_query_g(f, || FullIndexDataset::new(), |_, _, _, _| ArryDataset::new()             , query_num),
        Some(v) => {
            eprintln!("Unknown variant {}", v);
            process::exit(1);
        },
        None => {
            eprintln!("Unknown variant [NONE]");
        }
    }
}

fn request<G, FP, GP> (g: &G,
    generator: &FP,    
    query_num: usize) -> (f64, f64, usize)
    where G: MutableDataset,
        FP: Fn(bool, bool, bool, bool) -> GP,
        GP: MutableDataset
    {
    
    let dbo_person = Term::<&'static str>::new_iri("http://dbpedia.org/ontology/Person").unwrap();
    let dbr_vincent = Term::<&'static str>::new_iri("http://dbpedia.org/resource/Vincent_Descombes_Sevoie").unwrap();
    let none: Option<&Term<Rc<str>>> = None;

    // Build

    let t_build_start = OffsetDateTime::now_utc();
    let mut results = match query_num {
        1 => g.quads_with_pog(&rdf::type_, &dbo_person, none),
        2 => g.quads_with_sg(&dbr_vincent, none),
        3 => g.quads_with_po(&rdf::type_, &dbo_person),
        4 => g.quads_with_s(&dbr_vincent),
        _ => panic!("Unknown request")
    };

    let mut matched_dataset = match query_num {
        1 => generator(false,true ,true ,true ),
        2 => generator(true ,false,false,true ),
        3 => generator(false,true ,true ,false),
        4 => generator(true ,false,false,false),
        _ => panic!("Unknown request")
    };
    
    results.in_dataset(&mut matched_dataset).unwrap();
    
    let t_build_end = OffsetDateTime::now_utc();
    let t_build = (t_build_end - t_build_start).as_seconds_f64();

    // Loop

    let t_loop_start = OffsetDateTime::now_utc();
    
    let mut c = 0;
    matched_dataset.quads().for_each_quad(|_| {
        c += 1;
    }).unwrap();
    
    let t_loop_end = OffsetDateTime::now_utc();
    let t_loop = (t_loop_end - t_loop_start).as_seconds_f64();

    (t_build, t_loop, c)
}

fn task_query_g<F, G, R, FP, GP> (f: R, generator: F, generator_alt: FP, query_num: usize) where
    R: io::BufRead,
    G: MutableDataset,
    F: Fn() -> G,
    FP: Fn(bool, bool, bool, bool) -> GP,
    GP: MutableDataset
{
    let mut initial_dataset = generator();
    let m0 = get_vmsize();
    let t0 = OffsetDateTime::now_utc();
    nq::parse_bufread(f).in_dataset(&mut initial_dataset).expect("Error parsing NT file");
    let t1 = OffsetDateTime::now_utc();
    let m1 = get_vmsize();

    let time_parse = (t1-t0).as_seconds_f64();
    let mem_graph = m1-m0;
    eprintln!("loaded  : ~ {:?} triples\n", initial_dataset.quads().size_hint());

    let (time_first, time_rest, c) = request(&initial_dataset, &generator_alt, query_num);

    eprintln!("matching triple: {}\n", c);

    let (time_second, time_rest_second, _) = request(&initial_dataset, &generator_alt, query_num);

    let end_mem = get_vmsize() - m0;

    println!("{},{},{},{},{},{},{}", time_parse, mem_graph, end_mem, time_first, time_rest, time_second, time_rest_second);
}

fn main() {
    eprintln!("program : sophia");
    eprintln!("pid     : {}", process::id());
    let args: Vec<String> = env::args().collect();
    if args.len() < 3 {
        io::stderr().write(b"usage: sophia_benchmark <task> <filename.nt>\n").unwrap();
        process::exit(1);
    }
    let task_id: &str = &args[1];
    let filename = &args[2];
    let variant = if args.len() > 3 {
        Some(&args[3] as &str)
    } else {
        None
    };
    eprintln!("filename: {}", filename);
    let f = fs::File::open(&filename).expect("Error opening file");
    let f = io::BufReader::new(f);
    
    match task_id {
        "query" => task_query(f, variant, 1),
        "query2" => task_query(f, variant, 2),
        "query3" => task_query(f, variant, 3),
        "query4" => task_query(f, variant, 4),
        _   => {
            eprint!("Unknown task {}", task_id);
            process::exit(1);
        }
    };
}
