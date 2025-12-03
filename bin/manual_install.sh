#!/bin/bash

set -uo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <vault_base_dir> [version]"
  exit 1
fi

vault_dir="${1%/}"
plugin_version=${2:-latest}

plugin_repo_name=ewannema/obsidian-plugin-sorty
plugin_name=sorty

if [[ "${plugin_version}" = "latest" ]]; then
  repo_download_url="https://github.com/${plugin_repo_name}/releases/latest/download"
else
  repo_download_url="https://github.com/${plugin_repo_name}/releases/download/${plugin_version}"
fi

declare -a plugin_files=( "main.js" "styles.css" "manifest.json" )

obsidian_dir="${vault_dir}/.obsidian"
plugin_dir="${obsidian_dir}/plugins"

if ! command -v curl &> /dev/null; then
  echo "ERROR: curl is required for this script"
  exit 1
fi

echo "Installing the plugin ${plugin_name} ${plugin_version} to the vault at ${vault_dir}"

if [[ ! -d "${obsidian_dir}" ]]; then
  echo "ERROR: Directory ${obsidian_dir} does not appear to be an Obsidian vault"
  exit 1
fi

if [[ ! -d "${plugin_dir}" ]]; then
  echo "Plugin directory ${plugin_dir} does not exist. We will create it."
  mkdir -p "${plugin_dir}"
fi

for plugin_file in "${plugin_files[@]}"; do
  echo "Updating ${plugin_file}"
  remote_file="${repo_download_url}/${plugin_file}"
  local_file="${plugin_dir}/${plugin_file}"
  curl -sfL "$remote_file" -o  "${local_file}"

  if [[ $? != 0 ]]; then
    echo "ERROR: Download of ${remote_file} to ${local_file} failed"
	exit 1
  fi
done
