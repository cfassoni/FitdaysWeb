import io
import re
import pandas as pd
from datetime import datetime
from typing import List, Dict, Any, Tuple

def clean_float(val: Any) -> float | None:
    if pd.isna(val):
        return None
    if isinstance(val, (int, float)):
        return float(val)
    val_str = str(val).strip()
    if not val_str or val_str in ("-", "- -", "--"):
        return None
    match = re.match(r"^\s*(-?[0-9.]+)", val_str)
    if match:
        return float(match.group(1))
    return None

def parse_segmental(val: Any) -> Tuple[float | None, float | None, str | None]:
    if pd.isna(val):
        return None, None, None
    val_str = str(val).strip()
    if not val_str or val_str in ("-", "- -", "--"):
        return None, None, None
    parts = val_str.split('/')
    if len(parts) < 3:
        return None, None, None
    mass = clean_float(parts[0])
    pct = clean_float(parts[1])
    level = parts[2].strip()
    return mass, pct, level

def parse_impedance(val: Any) -> Tuple[float | None, float | None]:
    if pd.isna(val):
        return None, None
    val_str = str(val).strip()
    if not val_str or val_str in ("-", "- -", "--"):
        return None, None
    parts = val_str.split('/')
    if len(parts) < 2:
        return None, None
    high = clean_float(parts[0])
    low = clean_float(parts[1])
    return high, low

def parse_fitdays_file(file_content: bytes) -> List[Dict[str, Any]]:
    # Read Excel file using pandas with xlrd engine
    df = pd.read_excel(io.BytesIO(file_content), engine='xlrd')
    
    # Map headers dynamically to handles accent variations or spelling differences
    col_map = {}
    for col in df.columns:
        col_lower = col.lower().strip()
        col_clean = re.sub(r'[^\w\s-]', '', col_lower)
        
        # Check segmentals first
        segment = None
        for s in ["right arm", "left arm", "trunk", "right leg", "left leg"]:
            if s in col_clean:
                segment = s.replace(" ", "_")
                break
                
        if segment:
            if "gordura" in col_clean:
                col_map[col] = f"{segment}_fat"
            elif "equil" in col_clean or "musc" in col_clean:
                col_map[col] = f"{segment}_muscle"
            elif "imped" in col_clean:
                col_map[col] = f"{segment}_impedance"
        else:
            # Standard columns
            if "data" in col_clean:
                col_map[col] = "date"
            elif "peso-alvo" in col_clean:
                col_map[col] = "target_weight"
            elif "controle de peso" in col_clean:
                col_map[col] = "weight_control"
            elif "controle de gordura" in col_clean:
                col_map[col] = "fat_control"
            elif "controle muscular" in col_clean:
                col_map[col] = "muscle_control"
            elif "peso" in col_clean:
                col_map[col] = "weight"
            elif "imc" in col_clean:
                col_map[col] = "bmi"
            elif "gordura corporal" in col_clean:
                col_map[col] = "body_fat_pct"
            elif "gordura subcut" in col_clean:
                col_map[col] = "subcutaneous_fat_pct"
            elif "frequ" in col_clean:
                col_map[col] = "heart_rate"
            elif "cora" in col_clean:
                col_map[col] = "heart_index"
            elif "gordura visceral" in col_clean:
                col_map[col] = "visceral_fat"
            elif "agua corporal" in col_clean or "água corporal" in col_clean or "agua" in col_clean:
                col_map[col] = "body_water_pct"
            elif "massa musc  esquel" in col_clean or "massa musc esquel" in col_clean or "musc  esquel" in col_clean:
                col_map[col] = "skeletal_muscle_mass_pct"
            elif "massa muscular" in col_clean:
                col_map[col] = "muscle_mass"
            elif "massa ossea" in col_clean or "massa óssea" in col_clean:
                col_map[col] = "bone_mass"
            elif "proteina" in col_clean or "proteína" in col_clean:
                col_map[col] = "protein_pct"
            elif "tmb" in col_clean:
                col_map[col] = "bmr"
            elif "idade metab" in col_clean:
                col_map[col] = "metabolic_age"
            elif "massa gorda" in col_clean:
                col_map[col] = "fat_mass"
            elif "teor de umidade" in col_clean:
                col_map[col] = "moisture_content"
            elif "musculo esquel" in col_clean or "músculo esquel" in col_clean:
                col_map[col] = "skeletal_muscle_mass"
            elif "taxa muscular" in col_clean:
                col_map[col] = "muscle_rate_pct"
            elif "massa proteica" in col_clean or "massa protéica" in col_clean:
                col_map[col] = "protein_mass"
            elif "obesidade" in col_clean:
                col_map[col] = "obesity_score"
            elif "massa livre de gordura" in col_clean:
                col_map[col] = "fat_free_mass"
            elif "smi" in col_clean:
                col_map[col] = "smi"
            elif "pontuacao corporal" in col_clean or "pontuação corporal" in col_clean:
                col_map[col] = "body_score"

    records = []
    for _, row in df.iterrows():
        parsed_row = {}
        for original, target in col_map.items():
            val = row[original]
            if target == "date":
                # Handle dates format e.g. "06:37 20/03/2026"
                parsed_row[target] = datetime.strptime(str(val).strip(), "%H:%M %d/%m/%Y")
            elif "impedance" in target:
                high, low = parse_impedance(val)
                parsed_row[f"{target}_high"] = high
                parsed_row[f"{target}_low"] = low
            elif "fat" in target and ("arm" in target or "leg" in target or "trunk" in target):
                mass, pct, level = parse_segmental(val)
                parsed_row[f"{target}_mass"] = mass
                parsed_row[f"{target}_pct"] = pct
                parsed_row[f"{target}_level"] = level
            elif "muscle" in target and ("arm" in target or "leg" in target or "trunk" in target):
                mass, pct, level = parse_segmental(val)
                parsed_row[f"{target}_mass"] = mass
                parsed_row[f"{target}_pct"] = pct
                parsed_row[f"{target}_level"] = level
            elif target == "obesity_score":
                parsed_row[target] = int(clean_float(val)) if clean_float(val) is not None else None
            else:
                parsed_row[target] = clean_float(val)
        
        # Verify that we parsed at least date and weight before saving
        if "date" in parsed_row and "weight" in parsed_row:
            records.append(parsed_row)
            
    return records
