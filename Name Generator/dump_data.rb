require 'json'
data = {}
languages = [:arrghoun, :aslan, :oynprith, :solomani, :zdetl]
files = ['arrghoun_word_generator', 'aslan_word_generator', 'oynprith_word_generator', 'solomani_word_generator', 'zdetl_word_generator']

files.each do |f|
  require_relative "word_generator/word_generators/#{f}.rb"
end

classes = {
  arrghoun: ArrghounWordGenerator,
  aslan: AslanWordGenerator,
  oynprith: OynprithWordGenerator,
  solomani: SolomaniWordGenerator,
  zdetl: ZdetlWordGenerator
}

classes.each do |lang, klass|
  data[lang] = {
    initial_consonants: klass.const_get(:INITIAL_CONSONANTS),
    vowels: klass.const_get(:VOWELS),
    final_consonants: defined?(klass::FINAL_CONSONANTS) ? klass.const_get(:FINAL_CONSONANTS) : klass.const_get(:INITIAL_CONSONANTS),
    syllable_types_basic: klass.const_get(:SYLLABLE_TYPES_BASIC),
    syllable_types_alternate: klass.const_get(:SYLLABLE_TYPES_ALTERNATE)
  }
end

File.write('alienData.json', JSON.pretty_generate(data))
