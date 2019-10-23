import os
import csv
import errno
import math

# taken from
# http://thematicmapping.org/downloads/world_borders.php

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "clean", "coastline")

INPUT_FILE_NAME = "coastline.csv"

def makeDirs(path):
    if not os.path.exists(path):
        try:
            os.makedirs(path)
        except OSError as err:
            if err.errno != errno.EEXIST:
                raise


makeDirs(OUTPUT_DIR)

def get_filename(count):
    lookup = ["A", "B", "C", "D", "E", "F", "G"]
    out = [lookup[count % len(lookup)]]
    count = count - (count % len(lookup))
    exponent = 1
    while count > 0:
        coef = int(count / math.pow(len(lookup), exponent))
        coef = coef % len(lookup)
        coef = coef - 1
        if coef < 0:
            coef = len(lookup) - 1
        out.insert(0, lookup[coef])
        count = count - math.pow(len(lookup), exponent) * (coef + 1)
        exponent += 1
    return "".join(out)

def newline(f):
    f.write("\n")

vertices = []

with open(INPUT_FILE_NAME, "r") as f_input:
    output_file_name = os.path.join(OUTPUT_DIR, INPUT_FILE_NAME)
    csv_input = csv.reader(f_input, delimiter=",")
    next(csv_input)
    for row in csv_input:
        vertices.append({"X": row[0], "Y": row[1]})

duplicates = []
i = 0
while i < len(vertices):
    for j in range(i+1, len(vertices)):
        if vertices[i]['X'] == vertices[j]['X'] and vertices[i]['Y'] == vertices[j]['Y']:
            duplicates.append([i, j])
            i = j + 1
            break

for d in range(0, len(duplicates)):
    file_name = os.path.join(OUTPUT_DIR, get_filename(d) + ".csv")
    with open(file_name, "w") as f:
        f.write("X,Y")
        newline(f)
        for coor in range(duplicates[d][0], duplicates[d][1]+1):
            f.write(vertices[coor]['X'] + "," + vertices[coor]['Y'])
            newline(f)
