# install the open source program inkscape to convert the logo vector graphic to any wanted size
# https://inkscape.org/en/ - Check if nothing works if inkscape is in the path variable
echo "Convert the logo icon.svg to a 128x128px icon.png image:"
inkscape -f icon.svg -e icon.png --export-width=128 --export-height=128
echo "Conversion is ready"
