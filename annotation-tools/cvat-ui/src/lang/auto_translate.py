import os
import re
import json


class AutoTranslate(object):
    import_str0 = ["useTranslation", "const { t } = this.props"]
    import_str1 = "import { useTranslation } from 'react-i18next';"
    import_str3 = ["useTranslation", "const { t } = this.props"]
    obj_str = "\tconst { t } = useTranslation();"
    obj_str1 = "\tprivate t = useTranslation().t;"

    def __init__(self, path):
        self.path = path
        self.origin_code_content = None
        self.pattern_select_func = None

    def add_import(self):
        with open(self.path, 'r') as fp:
            self.origin_code_content = fp.read()
        if any((s in self.origin_code_content for s in self.import_str0)):
            return None
        pattern = r'(import.*?\n)'
        ret = re.findall(pattern, self.origin_code_content, re.S)
        new_code_content = self.origin_code_content.replace(ret[0], f'{self.import_str1}\n{ret[0]}')
        return new_code_content

    def add_import_0(self):
        with open(self.path, 'r') as fp:
            self.origin_code_content = fp.read()
        if any((s in self.origin_code_content for s in self.import_str0)):
            return None

        return new_code_content

    def _replace_func(self, match):
        match_1 = match.group(1)
        match_2 = match.group(2)

        return f'>{match_1}{self.pattern_select_func}{match_2}<'

    def replace_text(self, code_content, pattern_str, select_func):
        self.pattern_select_func = select_func
        pattern = r'>([.|\s]*?)%s([.|\s]*?)<' % pattern_str
        new_code_content = re.sub(pattern, self._replace_func, code_content, re.S)
        # if self.obj_str not in new_code_content and self.obj_str1 not in new_code_content:
        #     pattern = r'((null|>|JSX.Element)\s?\{.*%s.*})' % pattern_str
        #     ret = re.findall(pattern, new_code_content, re.S)
        #     if ret:
        #         ret_bk = ret[0][0]
        #         ret_bk = ret_bk.split('\n', 1)
        #         if ret[0][1] == '>':
        #             ret_bk.insert(1, self.obj_str1)
        #         else:
        #             ret_bk.insert(1, self.obj_str)
        #         ret_bk = '\n'.join(ret_bk)
        #         new_code_content = new_code_content.replace(ret[0][0], ret_bk)
        #     else:
        #         print(f'no object, {self.path}')

        return new_code_content

    def rewrite(self, code_content):
        print(f'self.path: {self.path}')
        with open(self.path, 'w') as fp:
            fp.write(code_content)


def main():
    base_dir = r'/home/shinemo/Projects/CVAT/cvat-develop/cvat-ui/src/components'
    ch_json_path = r'/home/shinemo/Projects/CVAT/cvat-develop/cvat-ui/src/lang/zh.json'
    en_json_path = r'/home/shinemo/Projects/CVAT/cvat-develop/cvat-ui/src/lang/en.json'
    re_y = ['.', '^', '$', '*', '+', '?', '\\', '[', ']', '(', ')', '|', '{', '}', '\d', '\w', '\s', '\b']
    with open(ch_json_path, 'r') as fp:
        ch_json_data = json.load(fp)
    with open(en_json_path, 'r') as fp:
        en_json_data = json.load(fp)

    for component_path_key, language_dict in en_json_data.items():
        if not language_dict:
            continue
        # if component_path_key not in [
        #     'annotation-page_canvas_views_canvas2d_canvas-hints_tsx'
        # ]:
        #     continue
        component_path = component_path_key.replace('_tsx', '.tsx').replace('_', '/')
        component_path = os.path.join(base_dir, component_path)
        obj = AutoTranslate(component_path)
        new_code_content = obj.add_import()
        if not new_code_content:
            continue
        for key, en_text in language_dict.items():
            select_func = "{t('%s.%s', '%s')}" % (component_path_key, key, en_text)
            ch_text = ch_json_data[component_path_key][key]
            if ch_text == en_text:
                continue
            for y in re_y:
                en_text = en_text.replace(y, f'\{y}')
            new_code_content = obj.replace_text(new_code_content, en_text, select_func)

        obj.rewrite(new_code_content)


if __name__ == '__main__':
    main()
