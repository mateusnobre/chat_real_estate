import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout';
import { authCheck } from '../../utils/auth';
import useApiClient from '../../helpers/api';
import styled, { css } from 'styled-components';
import classNames from 'classnames';
import Cookies from 'universal-cookie';
import DocumentTools from '../../components/DocumentTools';
import { Button, Dropdown, Input, Spacer } from '@nextui-org/react';

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 90vw;
  justify-content:space-around;
  align-items: flex-start;

`

const Loader = styled.div < { loading: boolean } > `
  align-self: center;
  opacity: 0;
  transition: opacity 300ms linear;

  ${({ loading }) =>
    loading &&
    css`
      opacity: 1;
    `}
`;

const ResultsDiv = styled.div < { loading: boolean } > `
  opacity: 1;
  transition: opacity 300ms linear;
  background-color: ${(props) => props.theme.primary};
  width: 100%;

  border: 1px solid ${(props) => props.theme.text_main};
  border-radius: 5px;
  font-size: 12px;
  height: 30vh;
  width: 50vw;
  margin-right: 30px;

  overflow-x: scroll;

  ${({ loading }) =>
    loading &&
    css`
      opacity: 0;
    `}
`;

const SourcesDiv = styled.div < { loading: boolean } > `
  opacity: 1;
  transition: opacity 300ms linear;
  background-color: ${(props) => props.theme.primary};
  border-radius: 5px;
  width: 50vw;
  margin-right: 30px;
  border: 1px solid ${(props) => props.theme.text_main};
  display: flex;
  flex-direction: column;
  height: calc(30vh - 22px);
  text-align: center;
  overflow-x: scroll;

  ${({ loading }) =>
    loading &&
    css`
      opacity: 0;
    `}
`;

const SourcesItem = styled.div`
  height: 100px;
  border-bottom: 1px solid ${(props) => props.theme.text_main};
  margin: 0px;
  width: 100%;

  &:first-child {
    height: 40px;
    border-bottom: 1px solid ${(props) => props.theme.text_main} !important;
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
`;

const SQLSource = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;
const ContentContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
    height: 100%;
    text-align: center;

  `
const SubContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    width: 100%;
    height: 100%;
    text-align: center;
  `
const cookies = new Cookies();

const Dashboard: React.FC = () => {
  const [indexes, setIndexes] = useState<{ id: string; name: string; customer_id: string }[]>([]);
  const [queryText, setQueryText] = useState('');
  const [responseText, setResponseText] = useState('');
  const [responseSources, setResponseSources] = useState<any[]>([]);
  const [SQLQuery, setSQLQuery] = useState('');
  const [resultSQLQuery, setResultSQLQuery] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [indexName, setIndexName] = useState(new Set(["Select Data Source"]));;
  const selectedIndexName = React.useMemo(
    () => Array.from(indexName).join(", ").replaceAll("_", " "),
    [indexName]
  );
  const [data_source, setDataSource] = useState('Documents');

  const apiClient = useApiClient();

  useEffect(() => {
    fetchIndexes();
  }, []);

  const processIndexes = (data: any[]) => {
    return data.map((index) => ({ id: index.pk, name: index.fields.name, customer_id: index.fields.customer }));
  };

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
    const nodeText = source.text.length > 150 ? source.text.substring(0, 130) + '...' : source.text;

    return (
      <SourcesItem>
        <p className="text">{nodeText}</p>
        <p className="footer">
          Similarity={source.similarity}, start={source.start}, end={source.end}
        </p>
      </SourcesItem>
    );
  });

  const handleQuerySubmit = async () => {
    try {
      setLoading(true);
      const response = await apiClient.makeRequest(
        'GET',
        `/llm_integration/query-index?text=${queryText}&index_name=${selectedIndexName}`
      );
      setLoading(false);
      if (response) {
        const data = response.data;
        if (data_source === 'BigQuery') {
          setResponseText(data.summary);
          setSQLQuery(data.sql_query);
          setResultSQLQuery(data.text);
        } else if (data_source === 'Documents') {
          setResponseText(data.text);
          setResponseSources(data.sources);
          console.log(data.sources);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout isAuthenticated={authCheck()} isSplashPage={true}>
      <DashboardContainer>

        <Dropdown>
          <Dropdown.Button color="primary" css={{ tt: "capitalize", width: "200px", textAlign: "start" }}>
            {selectedIndexName !== 'Select Data Source' ? <>Data Source: {selectedIndexName}</> : <>{selectedIndexName}</>}
          </Dropdown.Button>
          <Dropdown.Menu
            aria-label="Single selection actions"
            disallowEmptySelection
            selectionMode="single"
            selectedKeys={indexName}
            items={indexes}
            onSelectionChange={setIndexName}
          >
            {(item) => (
              <Dropdown.Item
                key={item.name}
              >
                {item.name}
              </Dropdown.Item>
            )}
          </Dropdown.Menu>
        </Dropdown>
        {selectedIndexName !== 'Select Data Source' ? (<ContentContainer>
          <SubContentContainer>

            <h4>Query Data Source</h4>
            <Input css={{ width: "50vw" }} name='queryText' id='queryText' aria-label='queryText' aria-describedby='queryText' required={true} placeholder='Your Question' type="text" value={queryText} onChange={(e) => setQueryText(e.target.value)} />
            <Spacer y={0.5} />

            <Button onClick={handleQuerySubmit}>Submit</Button>
            <Spacer y={0.5} />

            <div>
              <ResultsDiv loading={isLoading}>
                <h4 className="id">Query Response</h4>
                {responseText}
              </ResultsDiv>
              <Spacer y={0.5} />

              <SourcesDiv loading={isLoading}>
                <h4 className="id">Response Sources</h4>
                {data_source === 'Documents' ? sourceElems : <SQLSource><h3>SQL Query</h3><p>{SQLQuery}</p><h4>SQL Query Result</h4><p>{resultSQLQuery}</p></SQLSource>}
              </SourcesDiv>
            </div>
          </SubContentContainer>
          <SubContentContainer>
            <Spacer y={0.5} />
            <h4>Upload Your Data</h4>
            {selectedIndexName !== '' ? <DocumentTools index={selectedIndexName}></DocumentTools> : <a>Select an index to insert into</a>}
          </SubContentContainer>
        </ContentContainer>) : <></>}


      </DashboardContainer>
    </Layout>
  );
};

export default Dashboard;
