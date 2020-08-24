"""Module for creating static HTML pages for viewing screenshots from IoT-Ticket dashboards."""

# Copyright (c) Tampere University 2020.
# This software has been developed in ProCemPlus-project funded by Business Finland.
# This code is licensed under the MIT license.
# See the LICENSE.txt in the project root for the license terms.
#
# Main author(s): Ville Heikkila

import os

INDEX_FILENAME = "html/index.html"
HTML_FILENAME = "html/dashboard_{}.html"
SCREENSHOT_FILENAME = "dashboard_{}.png"

DASHBOARD_ITEM_TEMPLATE = \
    """            <li><a href="{url_path:}/{dashboard_number:}/">{dashboard_title:}</a></li>"""

INDEX_TEMPLATE = """<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title>{common_title:}</title>
    </head>
    <body>
        <h2>{common_title:}</h1>
        <ul>
{dashboard_list:}
        </ul>
    </body>
</html>
"""

DASHBOARD_TEMPLATE = """<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title>{dashboard_title:}</title>
    </head>
    <body style="margin:0; width: 100%; height: 100%; overflow: hidden">
        <img id="dashboardImage" src="{url_path:}/{screenshot_file:}"
             style="width: 100%; height: 100%; position: fixed; top: 0; left: 0;" />

        <script type="text/javascript">
            setInterval(function() {{
                var myImageElement = document.getElementById("dashboardImage");
                myImageElement.src = "{url_path:}/{screenshot_file:}?rand=" + Math.random();
            }}, {update_interval:});
        </script>
    </body>
</html>"""


def write_file(filename: str, file_text: str):
    """Writes the given text to the given file. Any existing file is overwritten."""
    try:
        with open(filename, mode="w", encoding="utf-8") as opened_file:
            opened_file.write(file_text)
        print("Created file {}".format(filename))
    except IOError as error:
        print("ERROR when writing to {}".format(filename))
        print(error)


def create_html_files():
    """Creates the static HTML files for viewing screenshots from IoT-Ticket dashboards."""
    dashboard_name_file = os.environ.get("dashboard_name_file", "")
    common_title = os.environ.get("common_title", "Dashboards")
    url_path = os.environ.get("url_path", "")
    update_interval = int(os.environ.get("update_interval", 10000))

    dashboard_names = []
    try:
        with open(dashboard_name_file, mode="r", encoding="utf-8") as name_file:
            for name in name_file:
                dashboard_names.append(name)
    except IOError as error:
        print(error)

    dashboard_item_list = []
    for dashboard_number, dashboard_name in enumerate(dashboard_names, start=1):
        dashboard_item_list.append(
            DASHBOARD_ITEM_TEMPLATE.format(
                url_path=url_path,
                dashboard_number=dashboard_number,
                dashboard_title=dashboard_name))
        dashboard_html = DASHBOARD_TEMPLATE.format(
            dashboard_title=dashboard_name,
            url_path=url_path,
            screenshot_file=SCREENSHOT_FILENAME.format(dashboard_number),
            update_interval=update_interval
        )
        write_file(HTML_FILENAME.format(dashboard_number), dashboard_html)

    index_html = INDEX_TEMPLATE.format(
        common_title=common_title,
        dashboard_list="\n".join(dashboard_item_list)
    )
    write_file(INDEX_FILENAME, index_html)


if __name__ == "__main__":
    create_html_files()
