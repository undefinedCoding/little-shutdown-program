#!/usr/bin/env python
# -*- coding: utf-8 -*-

'''
Create .ico file
'''

import os
from PIL import Image, ImageEnhance


def create_program_ico_icon(source_file, output_path_ico):
    """Creates all the ico icons."""

    if os.path.exists(source_file):

        img = Image.open(source_file)
        icon_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
        img.save(output_path_ico, sizes=icon_sizes)

        print("- \"" + source_file +
              "\" was converted to " + output_path_ico)

        img = Image.open(source_file)
        img = ImageEnhance.Color(img).enhance(0.0)
        icon_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
        img.save("uninstall_" + output_path_ico, sizes=icon_sizes)

        print("- \"" + source_file +
              "\" was converted to uninstall_" + output_path_ico)

    else:
        print("- \"" + source_file + "\" was not found")


def create_installer_bmps(source_file, output_file_installer, output_file_uninstaller):
    """Creates installer bmps."""

    if os.path.exists(source_file):

        img = Image.open(source_file)
        img.save(output_file_installer, 'BMP')
        print("- \"" + source_file +
            "\" was converted to " + output_file_installer)
        img = Image.open(source_file)
        img = ImageEnhance.Color(img).enhance(0.0)
        img.save(output_file_uninstaller, 'BMP')
        print("- \"" + source_file +
            "\" was converted to " + output_file_uninstaller)

    else:
        print("- \"" + source_file + "\" was not found")


if __name__ == '__main__':
    """Creates all images."""

    create_program_ico_icon("icon.png", "icon.ico")
    create_installer_bmps('installer.png', 'installerSidebar.bmp', 'uninstallerSidebar.bmp')

    print("Ready!")
