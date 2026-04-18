import random
import sys

def load_file(filename):
    """Reads a file and returns a list of lines, stripped of whitespace."""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        print(f"Error: {filename} not found.")
        sys.exit(1)

def linguistic_shift(text):
    """Applies random phonetic and character shifts to simulate evolution."""
    if not text:
        return text
    
    if random.random() < 0.3:
        return text

    vowels = "aeiouy"
    hard_to_soft = {"k": "s", "K": "S", "g": "j", "G": "J", "q": "c", "Q": "C"}
    soft_to_hard = {"c": "k", "C": "K", "s": "t", "S": "T", "z": "d", "Z": "D"}
    consonant_groups = {"th": "t", "ph": "f", "sh": "s", "ch": "k", "gh": "f"}

    temp_text = text
    for group, single in consonant_groups.items():
        if group in temp_text.lower() and random.random() < 0.8:
            temp_text = temp_text.replace(group, single)
            temp_text = temp_text.replace(group.capitalize(), single.capitalize())
    
    chars = list(temp_text)

    for i in range(len(chars)):
        roll = random.random()
        if chars[i].lower() in vowels and roll < 0.5:
            new_v = random.choice(vowels)
            chars[i] = new_v.upper() if chars[i].isupper() else new_v
        elif chars[i] in hard_to_soft and roll < 0.5:
            chars[i] = hard_to_soft[chars[i]]
        elif chars[i] in soft_to_hard and roll < 0.5:
            chars[i] = soft_to_hard[chars[i]]

    if random.random() < 0.5:
        idx = random.randint(0, len(chars))
        extra_char = random.choice("abcdefghijklmnopqrstuvwxyz")
        chars.insert(idx, extra_char)

    return "".join(chars)

def generate_names(count):
    first_names = load_file("first_names.txt")
    last_names = load_file("last_names.txt")
    prefixes = load_file("prefixes.txt")
    suffixes = load_file("suffixes.txt")

    for _ in range(count):
        # 1. Select First Name
        first = linguistic_shift(random.choice(first_names))
        
        # 2. Determine Last Name (15% chance of being hyphenated)
        is_hyphenated = random.random() < 0.15
        if is_hyphenated:
            part1 = linguistic_shift(random.choice(last_names))
            part2 = linguistic_shift(random.choice(last_names))
            last = f"{part1}-{part2}"
        else:
            last = linguistic_shift(random.choice(last_names))

        # 3. Determine Prefix (25% chance)
        prefix = random.choice(prefixes) if random.random() < 0.25 else ""
        
        # 4. Determine Suffix (25% chance, but ONLY if NOT hyphenated)
        suffix = ""
        if not is_hyphenated and random.random() < 0.25:
            suffix = random.choice(suffixes)

        # 5. Assemble the final last name block
        full_last_name = last
        
        if prefix:
            if prefix.endswith("'") or prefix.endswith("-"):
                full_last_name = f"{prefix}{full_last_name}"
            else:
                full_last_name = f"{prefix} {full_last_name}"
                
        if suffix:
            if suffix.startswith("-"):
                full_last_name = f"{full_last_name}{suffix}"
            else:
                full_last_name = f"{full_last_name} {suffix}"
        
        print(f"{first} {full_last_name}")

if __name__ == "__main__":
    num_to_generate = 10
    if len(sys.argv) > 1:
        try:
            num_to_generate = int(sys.argv[1])
        except ValueError:
            print("Usage: python script_name.py [number]")
            sys.exit(1)

    generate_names(num_to_generate)