import os, re, json

def parse_ruby_arrays(content):
    matches = re.finditer(r'([A-Z_]+)\s*=\s*\[([\s\S]*?)\]\.freeze', content)
    data = {}
    for match in matches:
        var_name = match.group(1).lower()
        items_str = match.group(2)
        items = []
        tuple_matches = re.finditer(r'\[\s*(?:\'([^\']+)\'|\:([a-z]+)|"([^"]+)")\s*,\s*(\d+)\s*\]', items_str)
        for t in tuple_matches:
            val = t.group(1) or t.group(2) or t.group(3)
            weight = int(t.group(4))
            items.append([val, weight])
        data[var_name] = items
    
    # Handle alias FINAL_CONSONANTS = INITIAL_CONSONANTS
    if 'FINAL_CONSONANTS = INITIAL_CONSONANTS' in content and 'final_consonants' not in data:
        if 'initial_consonants' in data:
            data['final_consonants'] = data['initial_consonants']

    return data

data = {}
files = ['arrghoun_word_generator', 'aslan_word_generator', 'oynprith_word_generator', 'solomani_word_generator', 'zdetl_word_generator']

for f in files:
    with open(f"word_generator/word_generators/{f}.rb", 'r') as file:
        content = file.read()
        parsed = parse_ruby_arrays(content)
        lang = f.split('_')[0]
        data[lang] = parsed

with open('alienData.js', 'w') as out:
    out.write("const proceduralData = ")
    json.dump(data, out, indent=2)
    out.write(";")
