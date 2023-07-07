import { useState, useEffect } from 'react';
import Layout from '../../components/layout';
import { authCheck } from '../../utils/auth';
import useApiClient from '../../helpers/api';
import Cookies from 'universal-cookie';

const cookies = new Cookies()
const MyIndexes = () => {
    const [indexes, setIndexes] = useState([]);
    const [newIndexName, setNewIndexName] = useState('');
    const customerId = cookies.get('customer_id');
    const apiClient = useApiClient();

    useEffect(() => {
        fetchIndexes();
    }, []);

    const processIndexes = (data) => {
        return data.map(index => ({ "id": index.pk, "name": index.fields.name, "customer_id": index.fields.customer }))

    }
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
            const data = { "name": newIndexName };
            const response = await apiClient.makeRequest('POST', '/llm_integration/indexes/create/', data);
            setIndexes([...indexes, processIndexes(response.data)]);
            setNewIndexName('');
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteIndex = async (indexId) => {
        if (confirm("Are you sure you want to delete this agent?") == true) {
            try {
                await apiClient.makeRequest('DELETE', `/llm_integration/indexes/delete/${indexId}/`);
                setIndexes(indexes.filter((index) => index.id !== indexId));
            } catch (error) {
                console.error(error);
            }
        } else {
            return
        }

    };

    return (
        <Layout isAuthenticated={authCheck()}>
            <div className="my_indexes" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "space-around", width: "100%", height: "70vh", padding: "20px" }}>
                <h1>My Agents</h1>
                <h2>Create New Agent</h2>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "space-around", width: "100%" }}>
                    <input
                        type="text"
                        value={newIndexName}
                        onChange={(e) => setNewIndexName(e.target.value)}
                    />
                    <button onClick={handleCreateIndex}>Create</button>
                </div>

                <h2>Existing Agents</h2>

                {
                    indexes.map((index) => (
                        <div style={{ display: 'flex', alignItems: "center", justifyContent: 'space-between', marginTop: "10px", paddingLeft: "10px", paddingRight: "10px", width: "100%", border: "1px solid black", borderRadius: "5px" }}>
                            <h3>
                                Agent {index.name}
                            </h3>
                            <button style={{ marginLeft: '10px', width: "80px", height: "30px" }} onClick={() => handleDeleteIndex(index.id)}>Delete</button>
                        </div>
                    ))
                }

            </div >
        </Layout >

    );
};

export default MyIndexes;