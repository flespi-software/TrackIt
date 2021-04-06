function getFromStore ({ store, storeName, name }) {
  const data = store.getItem(storeName)
  return data && data[name]
}

function setToStore ({ store, storeName, name, value }) {
  let data = store.getItem(storeName)
  if (!data) { data = {} }
  if (value) {
    data[name] = value
  } else {
    delete data[name]
  }
  store.set(storeName, data)
}

export {
  getFromStore,
  setToStore
}
