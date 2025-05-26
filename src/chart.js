import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';


import { parseCriterion } from './constants';

function processData(dataList) {
    const countDict = {};
  
    dataList.forEach(obj => {
      if (obj.analysis && typeof obj.analysis === "object") {
        Object.entries(obj.analysis).forEach(([key, value]) => {
          const level = value[0]; // "Suspeita Baixa", "Suspeita Moderada", "Suspeita Alta"
    
          if (["Suspeita Baixa", "Suspeita Moderada", "Suspeita Alta"].includes(level)) {
            if (!countDict[key]) {
              countDict[key] = { baixa: 0, moderada: 0, alta: 0 };
            }
  
            if (level === "Suspeita Baixa") countDict[key].baixa += 1;
            if (level === "Suspeita Moderada") countDict[key].moderada += 1;
            if (level === "Suspeita Alta") countDict[key].alta += 1;
          }
        });
      }
    });
  
    return Object.keys(countDict).map(key => ({
      name: key,
      baixa: countDict[key].baixa,
      moderada: countDict[key].moderada,
      alta: countDict[key].alta,
    }));
}
  

function BarChartComponent({ dataList }) {
    const data = processData(dataList);

    if (data.length === 0) {
        return null;
    }
  
    // Calcula o maior valor dos dados e adiciona uma margem de segurança
    const maxValue = Math.max(...data.flatMap(item => [item.baixa, item.moderada, item.alta]));
    const yAxisLimit = maxValue + Math.ceil(maxValue * 0.1); // Adiciona 10% de margem
  
    return (
        <section class="container chart">
            <BarChart width={600} height={300} data={data}>
                <XAxis dataKey="name" />
                <YAxis domain={[0, yAxisLimit]} />
                <Tooltip labelFormatter={(label) => parseCriterion[label]}/>
                <Legend verticalAlign="top" />
                <Bar dataKey="baixa" fill="#FFD700" radius={[10, 10, 0, 0]} name="Suspeita Baixa" />
                <Bar dataKey="moderada" fill="#FF6D00" radius={[10, 10, 0, 0]} name="Suspeita Moderada" />
                <Bar dataKey="alta" fill="#FF3D00" radius={[10, 10, 0, 0]} name="Suspeita Alta" />
            </BarChart>
        </section>
    );
  }
  
  export default BarChartComponent;