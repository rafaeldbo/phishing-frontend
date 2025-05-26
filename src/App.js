import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { createAnalysis, getAllAnalyses } from "./indexedDB";
import { parseCriterion } from './constants';
import BarChartComponent from './chart';


const PhishingDetector = () => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [color, setColor] = useState('var(--primary-color)');
  const [verdict, setVerdict] = useState("");
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    const data = await getAllAnalyses();
    setHistory(data);
  };

  const verdictFromScore = (score) => {
    if (score >= 5) {
      return "high";
    } else if (score >= 3) {
      return "moderate";
    } else if (score > 1) {
      return "low";
    }
    return "no";
  }

  useEffect(() => {
    fetchHistory();
  }, []);
  
  const exportCSV = () => {
    const csvContent = [
      ["Domínio", "Resultado", "Data"], // Cabeçalhos
      ...history.map(item => [
        item.domain,
        item.phishing,
        `"${new Date(item.timestamp).toLocaleString()}"`
      ])
    ]
    .map(row => row.join(","))
    .join("\n");
  
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "phishing-history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  useEffect(() => {
    if (result) {
      setColor(verdictFromScore(result.score));
      setVerdict(result.phishing || "Análise Inconclusiva");
    }
  }, [result]);

  function colorBySuspicious(suspicious) {
    if (suspicious === 'Suspeita Alta') {
      return 'high';
    } else if (suspicious === 'Suspeita Moderada') {
      return 'moderate';
    } else if (suspicious === 'Suspeita Baixa') {
      return 'low';
    } else {
      return 'no';
    }
  }

  const analyzeUrl = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8000/phishing", { url: url });
      setResult(response.data);
      const domain = response.data.domain;
      await createAnalysis(domain, response.data);
      await fetchHistory()
    } catch (error) {
      console.log(error)
      if (error)
        setError(error.response?.data?.detail || "Erro interno do servidor");
    }
  
    setLoading(false);
  };

  return (
    <>
      <form class="container input-form" onSubmit={(e) => e.preventDefault()}>
        <h1>Phishing Detector</h1>
        <input class="input-url"
          type="text"
          placeholder="Digite a URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button class="submit-button" onClick={analyzeUrl} disabled={loading}>
          {(loading) ? <div class="loading-circle"></div> : "Analisar"}
        </button>
        {error && <span>{error}</span>}
  
      </form>

      {result && (
        <section class="container result">
          <h2>Análise do Domínio: {result.domain}</h2>
          <h3 class={`suspicious-tag ${color}-bg`}>{verdict}</h3>
          <table class="result-table">
            <thead class="table-header">
              <tr>
                <th>Critério</th>
                <th>Nível de Suspeita</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(result.analysis).map(([key, [suspicious, description]]) => (
                <tr key={key}>
                  <td>{parseCriterion[key]}</td>
                  <td>
                    <span class={`suspicious-tag ${colorBySuspicious(suspicious)}-bg`}>
                      {suspicious}
                    </span>
                  </td>
                  <td>{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section class="container history">
        <h2>Histórico de Análises</h2>
        {history.length > 0 ? (
          <>
            <table class="history-table">
              <thead class="table-header">
                <tr>
                  <th>Domínio</th>
                  <th>Resultado</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, index) => (
                  <tr key={index}>
                    <td>{item.domain}</td>
                    <td> 
                      <span class={`suspicious-tag ${verdictFromScore(item.score)}-bg`}>
                        {item.phishing}
                      </span>
                    </td>
                    <td>{new Date(item.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button class="export-button" onClick={exportCSV}>Exportar .CSV</button>
          </>
        ) : (
          <p>Nenhuma análise realizada ainda.</p>
        )}
        
      </section>
      {history.length > 0 && <BarChartComponent dataList={history}/>}

    </>
  );
};

export default PhishingDetector;
