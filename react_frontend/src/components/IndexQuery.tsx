import React from 'react';
import { useState } from 'react';
import { CircleLoader } from 'react-spinners';
import classNames from 'classnames';
import styled from 'styled-components';
import Api from '../apis/api';

export type ResponseSources = {
  text: string;
  doc_id: string;
  start: number;
  end: number;
  similarity: number;
};

export type QueryResponse = {
  text: string;
  sources: ResponseSources[];
};

const IndexQueryDiv = styled.div`
display: flex;
flex-direction: column;
width: 50%;
`
const IndexQueryInputDiv = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  background-color: ${props => props.theme.primary};
  border-radius: 5px;
  padding: 10px;
`
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



const IndexQuery = () => {
  const [isLoading, setLoading] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [responseSources, setResponseSources] = useState<ResponseSources[]>([]);
  const [SQLQuery, setSQLQuery] = useState('' as string);
  const [resultSQLQuery, setResultSQLQuery] = useState('' as string);
  const [data_source, setDataSource] = React.useState('Documents');

  const handleDataSourceChange = (data_source: string) => {
    setDataSource(data_source);
  }

  const handleQuery = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key == 'Enter') {
      setLoading(true);
      Api("GET", "query", null, { text: e.currentTarget.value, data_source: data_source }).then((response) => {
        setLoading(false);
        if (!response) {
          return;
        }
        const data = response.data;
        if (data_source === 'BigQuery') {
          setResponseText(data.summary);
          setSQLQuery(data.sql_query);
          setResultSQLQuery(data.text);
        }
        else if (data_source === 'Documents') {
          setResponseText(data.text);
          setResponseSources(data.sources);
        }
      });
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

  return (
    <IndexQueryDiv>
      <IndexQueryInputDiv>
        <label htmlFor='query-text'>Ask a question!</label>
        <select name="data_source" value={data_source} onChange={event => handleDataSourceChange(event.target.value)}>
          <option id="0" >Documents</option>
          <option id="1" >BigQuery</option>
        </select>
        <input
          type='text'
          name='query-text'
          placeholder='Enter a question here'
          onKeyDown={handleQuery}
        ></input>
      </IndexQueryInputDiv>
      <Loader>
        <CircleLoader
          className={classNames({
            '--loading': isLoading,
          })}
          color='#00f596'
        />
      </Loader>

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
    </IndexQueryDiv>
  );
};

export default IndexQuery;
