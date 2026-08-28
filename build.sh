#!/bin/bash

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)";

version=$(grep -E '^version=' "${script_dir}/module.prop" | cut -d'=' -f2);
echo "Building Tasker Permissions Module v${version}";
sed "s/<p class=\"footer-text\">Tasker Permissions Module v.*<\/p>/<p class=\"footer-text\">Tasker Permissions Module v${version}<\/p>/g" \
    "${script_dir}/webui/index.html" > "${script_dir}/webui/index.tmp";
mv "${script_dir}/webui/index.tmp" "${script_dir}/webui/index.html";


rm -f "${script_dir}"/*.zip;
filename="tasker-permissions-module-v${version}.zip";
zip -r "${filename}" "module.prop" "action.sh" "webui" "banner.png" "logo.png";

echo "Zip file stored in $(realpath "${filename}")";

