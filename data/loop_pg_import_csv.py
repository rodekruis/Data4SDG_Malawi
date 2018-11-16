from sqlalchemy import create_engine
import pandas as pd
import os
import shutil
import sys

schema_name = 'public'
pathname = os.path.dirname(os.path.abspath(__file__))
engine = create_engine('postgresql://cradatabase:cradatabase@localhost/cradatabase')  

for file in os.listdir(pathname):
    print(file)
    if file.endswith(".csv"): 
    
        # Read in CSV
        filename = file
        path = os.path.join(pathname,filename)
        table_name = os.path.splitext(filename.replace('_%',''))[0]
        delim = ';' #',' / ';'
        df = pd.read_csv(path,delimiter=delim, encoding="windows-1251")
                
        # Upload table to SQL
        df.to_sql(table_name,engine,if_exists='replace',schema=schema_name)
        df = None
        
        continue
    else:
        continue





