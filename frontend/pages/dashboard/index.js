import React from 'react';
import { useState, useEffect } from 'react';
import Layout from '../../components/layout';
import { authCheck } from '../../utils/auth';
import useApiClient from '../../helpers/api';
import styled from 'styled-components';
import classNames from 'classnames';
import Cookies from 'universal-cookie';
import DocumentTools from '../../components/DocumentTools.tsx';

const Loader = styled.div`
  align-self: center;
  opacity: 0;
  transition: opacity 300ms linear;

  &--loading {
    opacity: 1;
  }
`

const ResultsDiv = styled.div`
  opacity: 1;
  transition: opacity 300ms linear;
  background-color: ${props => props.theme.primary};
  border-radius: 5px;
  font-size: 12px;
  height: 30vh;
  overflow-x: scroll;

  &--loading {
    opacity: 0;
  }
`

const SourcesDiv = styled.div`
  opacity: 1;
  transition: opacity 300ms linear;
  background-color: ${props => props.theme.primary};
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  height: calc(30vh - 22px);
  text-align: left;
  overflow-x: scroll;

  &--loading {
    opacity: 0;
  }
`
const SourcesItem = styled.div`
height: 100px;
border-bottom: 1px solid ${props => props.theme.text_main};
margin: 0px;
width: 100%;

&:first-child {
  height: 40px;
  border-bottom: 1px solid ${props => props.theme.text_main} !important;
  text-align: center;
  margin-bottom: 5px;
}

&:last-child {
  border-bottom: none;
}

&__id {
  font-size: 25px;
  margin-bottom: 3px;
  margin-top: 0;
}

&__text {
  font-size: 12px;
  margin-bottom: 3px;
  margin-top: 0;
}

&__footer {
  font-size: 10px;
  margin: 0;
}

`

const SQLSource = styled.div`
  display: flex;
  flex-direction: column;
  align-items:center;
`

const cookies = new Cookies()

const Dashboard = () => {
  const [indexes, setIndexes] = useState([]);

  const [queryText, setQueryText] = useState('');
  const [responseText, setResponseText] = useState('');
  const [responseSources, setResponseSources] = useState([]);
  const [SQLQuery, setSQLQuery] = useState('');
  const [resultSQLQuery, setResultSQLQuery] = useState('');
  const [isLoading, setLoading] = useState(false);

  const [indexName, setIndexName] = useState('');
  const [data_source, setDataSource] = useState('Documents');

  const apiClient = useApiClient();

  useEffect(() => {
    fetchIndexes();
  }
    , []);

  const processIndexes = (data) => {
    return data.map(index => ({ "id": index.pk, "name": index.fields.name, "customer_id": index.fields.customer }))

  }
  const fetchIndexes = async () => {
    try {
      const customerId = cookies.get('customer_id');

      const response = await apiClient.makeRequest('GET', `/llm_integration/indexes/by-user-id/${customerId}/`);
      if (response && response.data) {
        setIndexes(processIndexes(response.data));
      }
    } catch (error) {
      console.error(error);
    }
  };


  const sourceElems = responseSources.map((source) => {
    const nodeTitle =
      source.doc_id.length > 28
        ? source.doc_id.substring(0, 28) + '...'
        : source.doc_id;
    const nodeText =
      source.text.length > 150 ? source.text.substring(0, 130) + '...' : source.text;

    return (
      <SourcesItem key={source.doc_id}>
        <p className='id'>{nodeTitle}</p>
        <p className='text'>{nodeText}</p>
        <p className='footer'>
          Similarity={source.similarity}, start={source.start}, end=
          {source.end}
        </p>
      </SourcesItem>
    );
  });


  const handleQuerySubmit = async () => {
    try {
      setLoading(true);
      const response = await apiClient.makeRequest('GET', `/llm_integration/query-index?text=${queryText}&index_name=${indexName}`);
      setLoading(false);
      const data = response.data;
      if (data_source === 'BigQuery') {
        setResponseText(data.summary);
        setSQLQuery(data.sql_query);
        setResultSQLQuery(data.text);
      }
      else if (data_source === 'Documents') {
        setResponseText(data.text);
        setResponseSources(data.sources);
        console.log(data.sources)
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout
      isAuthenticated={authCheck()}
    >
      <div className="dashboard">

        <div className="query-agent">

          <h2>Query Agent</h2>
          <div>
            <input type="text" value={queryText} onChange={(e) => setQueryText(e.target.value)} />
            <form>
              <select
                onChange={(e) => { setIndexName(e.currentTarget.value); }}>
                <option disabled selected value> -- select an option -- </option>
                {
                  indexes.map(index => (
                    <option value={index.name} key={index.name}>Agent {index.name}</option>
                  ))
                }
              </select>
            </form>
            <button onClick={handleQuerySubmit}>Submit</button>
          </div>
          <div>
            <ResultsDiv
              className={classNames({
                '--loading': isLoading,
              })}
            >
              <SourcesItem>
                <h2 className='id'>Query Response</h2>
              </SourcesItem>
              {responseText}
            </ResultsDiv>
            <SourcesDiv
              className={classNames({
                '--loading': isLoading,
              })}
            >
              <SourcesItem>
                <h3 className='id'>Response Sources</h3>
              </SourcesItem>
              {data_source === 'Documents' ? sourceElems : <SQLSource><h3>SQL Query</h3><p>{SQLQuery}</p><h4>SQL Query Result</h4><p>{resultSQLQuery}</p></SQLSource>}
            </SourcesDiv>

          </div>
        </div>

        <div>

          <h2>Insert Into Agent</h2>
          {indexName !== '' ? <DocumentTools index={indexName}>
          </DocumentTools> : <a>Select an index to insert into</a>}
        </div>
      </div>
      <style jsx>{`
          .dashboard {
            margin-bottom: 50px;
            display: flex;
            flex-direction: row;
            align-items: flex-start;
            justify-content: space-between;
            width: 100%;
          
          }
          .query-agent {
            width: 50%;
            }

          .dashboard h4 {
            font-size: 100%;
            font-weight: bold;
            margin-bottom: 30px;
          }
        `}</style>
    </Layout>
  );
}


export default Dashboard;