function App() {
  // useEffect(() => {
  //   axios
  //     .get(`http://localhost:3000/backend/appState${document.location.search}`)
  //     .then((res) => {
  //       console.log(res.data);
  //     })
  //     .catch((err) => {
  //       console.log(err);
  //     });
  // }, []);

  return (
    <>
      <h2>Scavenger Hunt</h2>
      <div>Go find the clues and then come back to answer the big question!</div>
    </>
  );
}

export default App;
