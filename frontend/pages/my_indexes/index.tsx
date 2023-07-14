import { useState, useEffect } from 'react';
import Layout from '../../components/layout';
import { authCheck } from '../../utils/auth';
import useApiClient from '../../helpers/api';
import Cookies from 'universal-cookie';
import styled from 'styled-components';
import React from 'react';
import { Button, Spacer } from '@nextui-org/react';
import { Input } from '@nextui-org/react';
const cookies = new Cookies();
const MyIndexes = () => {
    const [indexes, setIndexes] = useState<{ id: string; name: string; customer_id: string }[]>([]);
    const [newIndexName, setNewIndexName] = useState('');
    const customerId = cookies.get('customer_id');
    const apiClient = useApiClient();

    useEffect(() => {
        fetchIndexes();
    }, []);

    const processIndexes = (data: any[]) => {
        return data.map((index) => ({ id: index.pk, name: index.fields.name, customer_id: index.fields.customer }));
    };

    const fetchIndexes = async () => {
        try {
            const response = await apiClient.makeRequest('GET', `/llm_integration/indexes/by-user-id/${customerId}/`);
            if (response && response.data) {
                setIndexes(processIndexes(response.data));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateIndex = async () => {
        try {
            if (newIndexName === "") {
                window.alert("Insert a valid data source name")
                return
            }
            const data = { name: newIndexName };
            const response = await apiClient.makeRequest('POST', '/llm_integration/indexes/create/', data);
            if (response) {
                setIndexes([...indexes, ...processIndexes(response.data)]);
                setNewIndexName('');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteIndex = async (indexId: string) => {
        if (window.confirm('Are you sure you want to delete this agent?')) {
            try {
                await apiClient.makeRequest('DELETE', `/llm_integration/indexes/delete/${indexId}/`);
                setIndexes(indexes.filter((index) => index.id !== indexId));
            } catch (error) {
                console.error(error);
            }
        } else {
            return;
        }
    };

    return (
        <Layout isAuthenticated={authCheck()} isSplashPage={true}>
            <div
                className="my_indexes"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'space-around',
                    width: '100%',
                    height: '70vh',
                    paddingTop: '40px'
                }}
            >
                <h2>My Data Sources</h2>
                <Spacer y={0.5} />

                <h3>Create New Data Source</h3>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-around',
                        width: '100%',
                    }}
                >
                    <Input type="text" placeholder='Name' value={newIndexName} onChange={(e) => setNewIndexName(e.target.value)} />
                    <Spacer y={0.5} />
                    <Button auto onClick={handleCreateIndex}>Create</Button>
                </div>
                <Spacer y={0.5} />

                <h3>Existing Data Sources</h3>
                {indexes.map((index) => (
                    <>
                        <IndexItem key={index.id}>
                            <h4>{index.name}</h4>
                            <Button auto onClick={() => handleDeleteIndex(index.id)}>Delete</Button>
                        </IndexItem>
                        <Spacer y={0.5} />

                    </>


                ))}
            </div>
        </Layout >
    );
};

const IndexItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  width: 100%;
  border: 1px solid black;
  border-radius: 5px;
`;

export default MyIndexes;
