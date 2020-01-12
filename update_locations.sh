#!/bin/bash

# Copyright (c) Tampere University 2020.
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

cp ./nginx_templates/location_index.conf ./nginx/location_index.conf
cp ./nginx_templates/location_png.conf ./nginx/location_png.conf
cp ./nginx_templates/location_html.conf ./nginx/location_html.conf

sed -i "1s/.*/$index_location/" ./nginx/location_index.conf
sed -i "1s/.*/$png_location/" ./nginx/location_png.conf
sed -i "1s/.*/$html_location/" ./nginx/location_html.conf
