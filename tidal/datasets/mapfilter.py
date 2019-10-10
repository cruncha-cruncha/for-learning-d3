import os
import csv
import errno

# taken from
# http://tides.gc.ca/eng/data

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "clean")

INPUT_TIME_COL_NAME = "TIME_TAG UTC (Z+0)"

OUTPUT_TIME_COL_NAME = "time" # semantically date, but this is easier down the line
OUTPUT_DATA_COL_NAME = "encoder"

dirs = [
    {"name": "Bella_Bella", "data_cols": ["QWE1", "QWE2"]},
    {"name": "Prince_Rupert", "data_cols": ["ENCODER1", "ENCODER2", "VEGA2"]},
    {"name": "Tofino", "data_cols": ["ENCODER1", "ENCODER2"]},
    {"name": "Vancouver", "data_cols": ["VEGA"]}
]

files = [
    "08-18.csv",
    "08-25.csv",
    "09-01.csv",
    "09-08.csv",
    "09-15.csv",
    "09-22.csv",
    "09-29.csv"
]

def makeDirs(path):
    if not os.path.exists(path):
        try:
            os.makedirs(path)
        except OSError as err:
            if err.errno != errno.EEXIST:
                raise

makeDirs(OUTPUT_DIR)

def try_float(v):
    try:
        float(v)
        return True
    except ValueError:
        return False

def newline(f):
    f.write("\n")

def parse_and_save(f_input, data_cols, f_output):
    csv_input = csv.reader(f_input, delimiter=",")

    titles = next(csv_input)
    if not INPUT_TIME_COL_NAME in titles:
        print("Could not find INPUT_TIME_COL_NAME '" + INPUT_TIME_COL_NAME + "' in file '" + f_input.name + "'")
        return
    time_index = titles.index(INPUT_TIME_COL_NAME)

    data_indices = []
    for data_col in data_cols:
        if data_col in titles:
            data_indices.append(titles.index(data_col))

    if len(data_cols) == 0:
        print ("Could not find any of: '" + "'".join(data_cols) + "' in file '" + f_input.name + "'")
        return

    f_output.write(OUTPUT_TIME_COL_NAME + "," + OUTPUT_DATA_COL_NAME)
    newline(f_output)

    count = 1
    at_least_one = False
    for row in csv_input:
        count += 1

        time = row[time_index]
        data = list(map(lambda v: float(v), filter(try_float, map(lambda i: row[i], data_indices))))

        if len(data) == 0:
            continue

        at_least_one = True

        f_output.write(time + ", " + str(sum(data) / float(len(data))))
        newline(f_output)

for d in dirs:
    d_name = d['name']
    data_cols = d['data_cols']
    makeDirs(os.path.join(OUTPUT_DIR, d_name))

    for f_name in files:
        input_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            d_name,
            f_name)
        if not (os.path.exists(input_path) and os.path.isfile(input_path)):
            print("Could not find input file '" + input_path + "'")
            continue

        output_path = os.path.join(OUTPUT_DIR, d_name, f_name)

        with open(input_path, 'r') as f_input:
            with open(output_path, 'w') as f_output:
                parse_and_save(f_input, data_cols, f_output)
