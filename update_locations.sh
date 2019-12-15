#!/bin/bash

# Copyright (c) Tampere University 2019.
# This software has been developed in ProCemPlus-project funded by Business Finland.
# This code is licensed under the MIT license.
# See the LICENSE.txt in the project root for the license terms.
#
# Main author(s): Ville Heikkila

url_path1=$(cat settings.env | grep url_path | cut --delimiter='=' --fields=2)
url_path2=${url_path1//'/'/'\/'}

index_location="location = $url_path2\/"
png_location="location ~ $url_path2\/dashboard_(.*).png"
html_location="location ~ $url_path2\/(.*)\/"

sed -i "1s/.*/$index_location/" ./nginx/location_index.conf
sed -i "1s/.*/$png_location/" ./nginx/location_png.conf
sed -i "1s/.*/$html_location/" ./nginx/location_html.conf
