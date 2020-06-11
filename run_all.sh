

array=( query query2 query3 query4 )
#array_programs=( sophia sophia_lg sophia_full sophia_tree sophia_array sophia_A sophia_lg_A sophia_full_A sophia_tree_A sophia_js sophia_array sophia_js_full sophia_js_lg sophia_js_tree sophia_A_js sophia_js_A_full sophia_js_A_lg sophia_js_A_tree sophia_js_array sophia_js_graphy )
#array_programs=( sophia_js_graphy )
array_programs=(
    # Rust
    #sophia      sophia_lg      sophia_full      sophia_tree      sophia_array
    # Rust to Array
    #sophia_A    sophia_lg_A    sophia_full_A    sophia_tree_A
    # Wasm
    #sophia_js   sophia_js_lg   sophia_js_full   sophia_js_tree   sophia_js_array
    # Wasm to Array
    #sophia_js_A sophia_js_A_lg sophia_js_A_full sophia_js_A_tree
    # Graphy
    #sophia_js_graphy
    # Wrapped
    rust_wrapped
)

# array_programs=( sophia_js sophia_array sophia_js_full sophia_js_lg sophia_js_tree sophia_js_A sophia_js_A_full sophia_js_A_lg sophia_js_A_tree sophia_js_array sophia_js_graphy )

#array_programs=( sophia_js sophia_js_graphy )

# Wrapped Dataset testing
# sophia sophia_js sophia_tree sophia_js_tree sophia_js_graphy
array_programs=( rust_wrapped )

for i in "${array[@]}"
do
    for j in "${array_programs[@]}"
    do
    	commandline="./run_benchmark $i $j"
        #echo $commandline
        bla=`$commandline`
    done
done

