# import os
# import re
# import json
# import hashlib
# from collections import defaultdict

# # Configurable paths and file types
# src_directory = './../components'
# extensions = ('.js', '.jsx', '.tsx')  # File extensions to search for text

# # Regex to match text inside JSX
# # text_regex = re.compile(r'>\s*([^<]+?)\s*<|{\s*([^}]+?)\s*}')

# # # A nested dictionary to store our found strings
# # translations = defaultdict(dict)

# # def generate_key(text, index):
# #     # Create a hash of the text to ensure uniqueness
# #     text_hash = hashlib.md5(text.encode('utf-8')).hexdigest()[:8]
# #     return f"{text_hash}_{index}"

# # # Walk through the source directory
# # for subdir, dirs, files in os.walk(src_directory):
# #     for file in files:
# #         if file.endswith(extensions):
# #             file_path = os.path.join(subdir, file)
# #             relative_path = os.path.relpath(file_path, src_directory)  # Get the relative path from src_directory
# #             component_name = relative_path.replace(os.sep, '.')  # Replace path separators with dots

# #             with open(file_path, 'r', encoding='utf-8') as f:
# #                 content = f.read()
# #                 matches = text_regex.findall(content)

# #                 # Process matches
# #                 for index, match in enumerate(matches):
# #                     text = match[0] if match[0] else match[1]
# #                     text = text.strip()

# #                     # Generate a unique key for the text
# #                     key = generate_key(text, index)

# #                     # Add to our translations dictionary
# #                     translations[component_name][key] = text

# # # Save the translations to a JSON file
# # with open('translations.json', 'w', encoding='utf-8') as f:
# #     json.dump(translations, f, indent=2, ensure_ascii=False)

# # Regex to match text nodes and components that could contain text
# # This is a basic example and may need to be expanded based on the actual components used in your project
# # pattern = re.compile(r'<[^>]+>(.*?)<\/[^>]+>', re.DOTALL)

# text_patterns = [
#     re.compile(r'<([A-Za-z]+)[^>]*>(.*?)<\/\1>',re.DOTALL),
#     # re.compile(r'<a [^>]*>(.*?)<\/a>')

#     # re.compile(r'<Text[^>]*>(.*?)<\/Text>'),  # Matches text within <Text> components
#     # re.compile(r'>\s*([^<]+?)\s*<'),
#     # re.compile(r'{\s*([^}]+?)\s*}'),
#     # re.compile(r'>([^<]+?)<'),  # Matches text between tags
#     # re.compile(r'\bplaceholder=["\'](.*?)["\']'),  # Matches placeholder attributes
#     # re.compile(r'\balt=["\'](.*?)["\']'),  # Matches alt attributes for images
#     # re.compile(r'\btitle=["\'](.*?)["\']'),  # Matches title attributes
#     # ... Add more patterns as needed for other attributes or elements
#     # re.compile(r'>\s*([^<]+?)\s*<|{\s*([^}]+?)\s*}'),
#     # re.compile(r'<Text[^>]*>(.*?)<\/Text>'),  # Matches text within <Text> components
#     # re.compile(r'<span[^>]*>(.*?)<\/span>'),  # Matches text within <span>
# ]

# translations = defaultdict(dict)

# def slugify(value):
#     # Normalize, lowercasing, and replacing spaces with underscores
#     return re.sub(r'\s+', '_', value).strip().lower()

# def unique_key(base_key, existing_keys):
#     # Append a number to the key to make it unique
#     counter = 1
#     unique = base_key
#     while unique in existing_keys:
#         unique = f"{base_key}_{counter}"
#         counter += 1
#     return unique

# # Walk through the source directory
# for subdir, dirs, files in os.walk(src_directory):
#     for file in files:
#         if file.endswith(extensions):
#             file_path = os.path.join(subdir, file)
#             relative_path = os.path.relpath(file_path, src_directory)
#             component_namespace = relative_path.replace(os.path.sep, '.').rsplit('.', 1)[0]

#             with open(file_path, 'r', encoding='utf-8') as f:
#                 content = f.read()

#                 # Look for matches using all patterns
#                 for pattern in text_patterns:
#                     for match in pattern.findall(content):
#                         print(match)
#                         text = match[1].strip()
#                         if text:
#                             key = slugify(text)
#                             unique = unique_key(key, translations[component_namespace])

#                             # Assign the text to the component's namespace in translations
#                             translations[component_namespace][unique] = text

# # Save the translations to a JSON file
# with open('translations.json', 'w', encoding='utf-8') as f:
#     json.dump(translations, f, ensure_ascii=False, indent=2)


# import os
# import re
# import json
# import hashlib
# from collections import defaultdict

# # Configurable paths and file types
# src_directory = './../components'
# extensions = ('.js', '.jsx', '.tsx')  # File extensions to search for text

# # Regex to match text inside JSX
# text_regex = re.compile(r'>\s*([^<]+?)\s*<|{\s*([^}]+?)\s*}')

# # A nested dictionary to store our found strings
# translations = defaultdict(dict)

# # Updated generate_key function
# def generate_key(file_path, text, index):
#     # Create a stable base for the key from the file path and text
#     base = f"{file_path}-{text}"
#     # Create a hash of the base to ensure uniqueness and stability
#     base_hash = hashlib.md5(base.encode('utf-8')).hexdigest()[:8]
#     return f"{base_hash}_{index}"

# # Walk through the source directory
# for subdir, dirs, files in os.walk(src_directory):
#     for file in files:
#         if file.endswith(extensions):
#             file_path = os.path.join(subdir, file)
#             relative_path = os.path.relpath(file_path, src_directory).replace(os.sep, '/')
#             component_name = relative_path.replace('/', '.')  # Use relative path for uniqueness

#             with open(file_path, 'r', encoding='utf-8') as f:
#                 content = f.read()
#                 matches = text_regex.findall(content)

#                 # Process matches
#                 for index, match in enumerate(matches):
#                     text = match[0] if match[0] else match[1]
#                     text = text.strip()

#                     # Generate a unique key for the text based on file path
#                     key = generate_key(relative_path, text, index)

#                     # Add to our translations dictionary
#                     translations[component_name][key] = text

# # Save the translations to a JSON file
# with open('translations.json', 'w', encoding='utf-8') as f:
#     json.dump(translations, f, indent=2, ensure_ascii=False)



import os
import json
from bs4 import BeautifulSoup
from collections import defaultdict

# 配置路径和文件类型
src_directory = './../components'
extensions = ('.js', '.jsx', '.tsx')  # 要搜索文本的文件扩展名

# 用于存储找到的字符串的嵌套字典
translations = defaultdict(dict)

# 遍历源目录
for subdir, dirs, files in os.walk(src_directory):
    for file in files:
        if file.endswith(extensions):
            file_path = os.path.join(subdir, file)
            relative_path = os.path.relpath(file_path, src_directory)  # 获取相对于src_directory的相对路径
            component_name = relative_path.replace(os.sep, '.')  # 用点替换路径分隔符

            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                # 假设React组件的HTML内容是以字符串形式存在，需要找到这些字符串并解析
                soup = BeautifulSoup(content, 'lxml')
                
                # 提取所有标签内的文本内容
                texts = soup.find_all(text=True)
                for index, text in enumerate(texts):
                    text = text.strip()
                    if text:  # 忽略空白文本
                        key = f"{component_name}.{index}"
                        translations[component_name][key] = text

# 保存翻译到JSON文件
with open('translations.json', 'w', encoding='utf-8') as f:
    json.dump(translations, f, indent=2, ensure_ascii=False)
