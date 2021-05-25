const { addEntries } = require("./populateDB")

const objs = [{
  _id: "test",
  createdAt: 123456789,
  msg: "this is a test",
}];


(async () => {
  await addEntries("testing", objs);
  console.log("added test entry");
})();
