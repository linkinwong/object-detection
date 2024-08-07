




#!/opt/homebrew/bin/bash
# Sample commands to deploy nuclio functions on CPU
# /bin/bash

set -eu
# Set proxy environment variables
export HTTP_PROXY="http://10.10.60.21:7890"
export HTTPS_PROXY="http://10.10.60.21:7890"
export NO_PROXY="localhost,127.0.0.1"
export DOCKER_BUILDKIT=0

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
FUNCTIONS_DIR=${1:-$SCRIPT_DIR}
echo $FUNCTIONS_DIR
#export DOCKER_BUILDKIT=1


nuctl create project cvat --platform local

shopt -s globstar

for func_config in "$FUNCTIONS_DIR"/**/function-gpu.yaml

do
    func_root="$(dirname "$func_config")"

    func_rel_path=$(python3 -c "import os; print(os.path.relpath(os.path.dirname('$func_root'), '$SCRIPT_DIR'))")

    #echo "Function root directory: $func_root, Relative path: $func_rel_path"

    #if [ -f "$func_root/Dockerfile" ]; then
    #    echo "docker build -t cvat.${func_rel_path//\//.}.base  $func_root"
	#docker build -t "cvat.${func_rel_path//\//.}.base" "$func_root"
        #`echo "docker build -t cvat.${func_rel_path//\//.}.base  $func_root"
   # fi

    echo "Deploying $func_rel_path function..."
    nuctl deploy --project-name cvat --path "$func_root" \
        --file "$func_config" --platform local   --verbose
done


nuctl get function --platform local
