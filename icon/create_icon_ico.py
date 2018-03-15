#!/usr/bin/env python
# -*- coding: utf-8 -*-

'''
Create .ico file
'''

import os
from PIL import Image


def create_program_ico_icon(source_file, output_path_ico):
    """Creates all the ico icons."""

    if os.path.exists(source_file):

        img = Image.open(source_file)
        icon_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
        img.save(output_path_ico, sizes=icon_sizes)

        print("- \"" + source_file +
              "\" was converted to " + output_path_ico)
    else:
        print("- \"" + source_file + "\" was not found")


if __name__ == '__main__':
    """Creates all images."""

    create_program_ico_icon("icon.png", "icon.ico")

    print("Ready!")
