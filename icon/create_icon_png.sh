# install the open source program inkscape to convert the logo vector graphic to any wanted size
# https://inkscape.org/en/ - Check if nothing works if inkscape is in the path variable
echo "Convert the logo icon.svg to a 256x256px icon.png image:"
inkscape -f icon.svg -e icon.png --export-width=256 --export-height=256
echo "Convert the installer picture installer.svg to a 164x314px installer.png image:"
inkscape -f installer.svg -e installer.bmp --export-width=164 --export-height=314
echo "Conversion is ready"
