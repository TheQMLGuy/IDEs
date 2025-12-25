import sys
import json
import subprocess
from kaggle.api.kaggle_api_extended import KaggleApi

def init_api():
    api = KaggleApi()
    try:
        api.authenticate()
        return api
    except Exception as e:
        print(json.dumps({"error": f"Authentication failed: {str(e)}. Please ensure kaggle.json is in ~/.kaggle/"}))
        sys.exit(1)

def search_datasets(query):
    api = init_api()
    try:
        datasets = api.dataset_list(search=query, sort_by='hottest')
        result = []
        for d in datasets[:10]:
            result.append({
                "id": str(d.ref),
                "name": str(d.title) if hasattr(d, 'title') else str(d.ref),
                "size": str(d.totalBytes) if hasattr(d, 'totalBytes') else "Unknown",
                "url": f"https://www.kaggle.com/datasets/{d.ref}"
            })
        print(json.dumps({"success": True, "data": result}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))


def download_dataset(dataset_id, path):
    api = init_api()
    try:
        api.dataset_download_files(dataset_id, path=path, unzip=True)
        print(json.dumps({"success": True, "message": f"Downloaded {dataset_id} to {path}"}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided"}))
        sys.exit(1)

    command = sys.argv[1]
    
    if command == "search":
        search_datasets(sys.argv[2])
    elif command == "download":
        download_dataset(sys.argv[2], sys.argv[3])
    else:
        print(json.dumps({"error": "Invalid command"}))
