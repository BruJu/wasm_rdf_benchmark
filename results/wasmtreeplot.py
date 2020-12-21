import csv
import statistics 

import matplotlib.patches as mpatches
import matplotlib.pyplot as plt

from pytreemap import TreeMap

# Number of values removed by the compact method at each bound
# (for olympic average)
out = 2

###############################################################################
#### Loading

def load_query_measures(filename):
    all_queries = {
        'S': TreeMap(),
        'POG': TreeMap()
    }
    with open(filename, 'r') as file:
        reader = csv.reader(file)
        isHeader = True

        for row in reader:
            if isHeader:
                isHeader = False
            else:
                l = all_queries[row[2]]
                key = (row[0], row[1])
                size = int(row[3])
                value = { "match" : float(row[9]), "loop" : float(row[10]) }
                if key not in l:
                    l[key] = TreeMap()
                if size not in l[key]:
                    l[key][size] = []
                l[key][size].append(value)

    return all_queries

def load_initialization_measures(filename):
    retval = {}

    with open(filename, 'r') as file:
        reader = csv.reader(file)
        isHeader = True

        for row in reader:
            if isHeader:
                isHeader = False
            else:
                t = (row[0], int(row[1]))
                d = { "memory" : int(row[4]), "time" : float(row[5]) }

                if t not in retval:
                    retval[t] = []
                
                retval[t].append(d)

    return retval


###############################################################################
#### Reducing the data

def average_arith(l):
    s = 0
    for x in l:
        s += x
    return s / len(l)

def avg_stdev(l):
    return (average_arith(l), statistics.stdev(l))

def avg_stdev2(l):
    # /!\ There is a bug in the submitted charts:
    # where l values were used instead of lp
    lp = [x * 1024 for x in l]

    average = statistics.mean(lp)
    stdev = statistics.stdev(lp)

    return (average / 1024, stdev / 1024)

# Reduce a list of dict into one dict
def compact(list_of_dict, reducer):
    retval = TreeMap()

    # list of dict -> dict of list
    for dict in list_of_dict:
        for key in dict:
            if key not in retval:
                retval[key] = []

            retval[key].append(dict[key])

    # dict of list -> dict of integer
    for key in dict:
        retval[key].sort()
        retval[key] = retval[key][out:-out] if out != 0 else retval[key]
        retval[key] = reducer(retval[key])

    return retval

def reduce_query_data(data_to_reduce):
    reduce_match_data = {}
    reduce_match_data_stdev = {}

    for pattern in data_to_reduce:
        if pattern not in reduce_match_data:
            reduce_match_data[pattern] = {}
            reduce_match_data_stdev[pattern] = {}

        patA = data_to_reduce[pattern]
        for dataset in patA:
            if dataset not in reduce_match_data[pattern]:
                reduce_match_data[pattern][dataset] = TreeMap()
                reduce_match_data_stdev[pattern][dataset] = TreeMap()

            datA = patA[dataset]
            for size in datA:
                reduce_match_data[pattern][dataset][size] = compact(datA[size], average_arith)
                reduce_match_data_stdev[pattern][dataset][size] = compact(datA[size], avg_stdev2)
        
    return reduce_match_data, reduce_match_data_stdev

def reduce_loading(load_data):
    reduce_load_data = {}
    loading_speed = {}

    def load_speed(data):
        values = [1000000 / x['time'] for x in data]
        return avg_stdev(values)   

    for dataset in load_data:
        reduce_load_data[dataset] = compact(load_data[dataset], average_arith)
        loading_speed[dataset] = load_speed(load_data[dataset])
    
    return reduce_load_data, loading_speed



###############################################################################
#### Print


def memory_as_string(reduce_load_data):
    s = ""
    for key in reduce_load_data:
        if s != "":
            s += "\n"
        s += str(key) + " => " + str(reduce_load_data[key])
    return s

def difference(reduce_match_data, pattern, kind, compared, kind2 = None, compared2 = None):
    if kind2 is None:
        kind2 = kind

    if compared2 is None:
        compared2 = "wasm_tree"

    def get(p, k, c, reducer):
        data    = reduce_match_data[p][(k, c)]
        data_wt = reduce_match_data[p][(kind2, compared2)]
        return reducer([(data[s]["match"] + data[s]["loop"]) / (data_wt[s]["match"] + data_wt[s]["loop"]) for s in data])

    cmin = get(pattern, kind, compared   , min)
    cmax = get(pattern, kind, compared   , max)
    print("For " + pattern + " Wasm tree is " + "{:0.3f}".format(cmin) + " to " + "{:0.3f}".format(cmax) + " faster than " + compared)


##############################################################################
#### Generating plots


def loading_boxplot(loading_speed, datasets):
    plt.rcParams["figure.figsize"]=5,5

    data_left  = { "data" : [], "std" : [], "color": []}
    data_right = { "data" : [], "std" : [], "color": []}
    data       = { "data" : [], "std" : [], "color": []}
    labels     = []
    
    legend_handles = []

    for dataset in datasets:
        d = []
        std = []
        l = []

        extra = ""

        for datum in loading_speed:
            if datum[0] == dataset[0]:
                d.append(loading_speed[datum][0])
                std.append(loading_speed[datum][1])
                l.append(str(datum[1]))

        if len(l) == 2 and l[0] > l[1]:
            d   = [x for x in reversed(d)  ]
            std = [x for x in reversed(std)]
            l   = [x for x in reversed(l)  ]
        
        def make_label(nb):
            s = dataset[1] + " (" + str(nb) + " index"
            if nb != "1":
                s += "es"
            return s + ")"

        if len(l) == 2:
            legend_handles.append(mpatches.Patch(color=dataset[2], label=make_label(l[0])))
            legend_handles.append(mpatches.Patch(color=dataset[3], label=make_label(l[1])))
        else:
            legend_handles.append(mpatches.Patch(color=dataset[4], label=make_label(l[0])))

        if len(l) == 2:
            data_left["data"].append(d[0])
            data_left["std"].append(std[0])
            data_right["data"].append(d[1])
            data_right["std"].append(std[1])
        else:
            data_left["data"].append(0)
            data_left["std"].append(0)
            data_right["data"].append(0)
            data_right["std"].append(0)

            
        if len(l) == 1:
            data["data"].append(d[0])
            data["std"].append(std[0])
        else:
            data["data"].append(0)
            data["std"].append(0)
        
        data_left ["color"].append(dataset[2])
        data_right["color"].append(dataset[3])
        data      ["color"].append(dataset[4])

        labels.append(dataset[1] + extra)

    color = ['#1f77b4' for x in labels]
    color[-1] = "#ff7f0e"
    plt.bar([x - 0.2 for x in range(len(data_left ["data"]))], data_left ["data"], width=0.4, yerr=data_left ["std"], edgecolor='black', capsize=5, color=data_left ["color"])
    plt.bar([x + 0.2 for x in range(len(data_right["data"]))], data_right["data"], width=0.4, yerr=data_right["std"], edgecolor='black', capsize=5, color=data_right["color"])
    plt.bar([x       for x in range(len(data      ["data"]))], data      ["data"], width=0.5, yerr=data      ["std"], edgecolor='black', capsize=5, color=data      ["color"])

    plt.ylabel('Loaded quads per second')

    plt.xticks([])

    plt.legend(handles=legend_handles, loc = 4, framealpha=0.90)
    plt.show()


def rename(x):
    if x == 80000:
        return ""
    if x == 1000000:
        return "1M"
    else:
        return str(x // 1000) + "k"


def simple_plot(source, datasets, yminlim, ymaxlim, pat):
    # input:
    # { 'S' : { (tool, dataset) : { size : { match : T , loop : T }, ... } , 'POG' : ... }
    plt.rcParams["figure.figsize"]=5,5

    for key in datasets:
        x = []
        y = []
        name_x = []

        d = source[(key[0], key[1])]

        for quads in d:
            x.append(quads)
            y.append(d[quads]["match"] + d[quads]["loop"])
            name_x.append(rename(quads))

        l = plt.loglog(x, y, key[3], label=key[2])
        l[0].set_marker(key[4])

    axes = plt.gca()
    axes.set_ylim(yminlim, ymaxlim)

    plt.xticks(x, labels=name_x)
    plt.xlabel("Total number of quads in the dataset")
    plt.ylabel("Time to find every quad matching the " + pat + " pattern")
    plt.legend()

    plt.show()

def repartition(data, requiredS, hide_2th=None):
    plt.rcParams["figure.figsize"]=5,5
    matches = []
    stdmatches = []
    foreaches = []
    stdforeaches = []
    names = []

    for required in requiredS:
        d = data[(required[0], required[1])][1000000]

        matches     .append(d["match"][0] * 1000)
        stdmatches  .append(d["match"][1] * 1000)
        foreaches   .append(d["loop" ][0] * 1000)
        stdforeaches.append(d["loop" ][1] * 1000)
                
        names.append(required[2])
    
    ind = [x for x in range(len(requiredS))]
    
    fig, ax = plt.subplots()
    pmatch = plt.barh(ind, matches  , 0.45, edgecolor='black', capsize=5, tick_label=names, xerr=stdmatches  )
    pforea = plt.barh(ind, foreaches, 0.45, edgecolor='black', capsize=5, left=matches    , xerr=stdforeaches)

    plt.legend((pforea[0], pmatch[0]), ("Loop", "Match"))

    plt.xlabel("Time in milliseconds")
    mheight = max([matches[i] + foreaches[i] + stdforeaches[i] for i in range(len(matches))])
    plt.gca().invert_yaxis()
    
    if hide_2th:
        i = 0
        for label in ax.get_xticklabels():
            if i % 2 == 1:
                label.set_visible(False)
            i += 1

    plt.show()
