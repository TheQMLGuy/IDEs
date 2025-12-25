import sys
import json
import os
import pandas as pd
import numpy as np

def analyze_and_recommend(file_path):
    try:
        # If directory, find first csv
        if os.path.isdir(file_path):
            files = [f for f in os.listdir(file_path) if f.endswith('.csv')]
            if not files:
                return {"error": "No CSV files found in directory"}
            file_path = os.path.join(file_path, files[0])
        
        df = pd.read_csv(file_path, nrows=1000) # Sample for speed
        
        info = {
            "rows": len(df),
            "columns": len(df.columns),
            "numeric_cols": len(df.select_dtypes(include=[np.number]).columns),
            "categorical_cols": len(df.select_dtypes(exclude=[np.number]).columns),
            "missing_values": int(df.isnull().sum().sum())
        }
        
        # Simple heuristic for recommendation
        # Assume last column is target if not specified (naive)
        # Or look for common target names like 'target', 'label', 'survived', 'price'
        
        target_candidates = ['target', 'label', 'class', 'y', 'survived', 'price']
        target_col = None
        for col in df.columns:
            if col.lower() in target_candidates:
                target_col = col
                break
        
        if not target_col:
            target_col = df.columns[-1] # Fallback
            
        target_type = "Unknown"
        recommendation = ""
        
        if target_col:
            y = df[target_col]
            unique_vals = y.nunique()
            if unique_vals < 20 or y.dtype == 'object':
                target_type = "Classification"
                recommendation = "Detected Classification problem. Recommended models: Random Forest Classifier, Gradient Boosting (XGBoost), or Logistic Regression."
                if len(df) < 1000:
                    recommendation += " Since dataset is small, SVM might also work well."
            else:
                target_type = "Regression"
                recommendation = "Detected Regression problem. Recommended models: Random Forest Regressor, XGBoost Regressor, or Linear Regression (Ridge/Lasso)."
        
        return {
            "success": True,
            "analysis": info,
            "target_detected": target_col,
            "problem_type": target_type,
            "recommendation": recommendation
        }

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
        sys.exit(1)
        
    path = sys.argv[1]
    result = analyze_and_recommend(path)
    print(json.dumps(result))
