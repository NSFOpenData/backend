const { addEntries } = require("./populateDB")

const objs = [{
  _id: "test",
  time: 123456,
  msg: "this is a test",
}];


(async () => {
  await addEntries("testing", objs);
  console.log("added test entry");
})();
