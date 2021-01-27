#!/bin/bash

# Copyright (c) Tampere University 2020.
# This software has been developed in ProCemPlus-project funded by Business Finland.
# This code is licensed under the MIT license.
# See the LICENSE.txt in the project root for the license terms.
#
# Main author(s): Ville Heikkila

# move to the script folder, from https://stackoverflow.com/a/246128
cd $( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )

source stop_service.sh
source start_service.sh
