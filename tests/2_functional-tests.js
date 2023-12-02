const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");
const mongoose = require("mongoose");
const { Thread, Reply } = require("../models");

after(function () {
  chai.request(server).get("/api");
});

chai.use(chaiHttp);

const getThreadId = async (text, delete_password) => {
  let thread = await Thread.findOne({ text: text ? text : "test", delete_password: text ? text : "test" });
  if (!thread) {
      thread = await Thread.create({
      board: "test",
      text: "test",
      delete_password: "test",
      created_on: new Date(),
      bumped_on: new Date(),
      replies: []
    })
  }
  return thread
}

const getReplyId = async (thread_id) => {
  let thread = await Thread.findById(thread_id)
  let reply = thread.replies.length > 0 ? thread.replies[0] : "";
  if (!reply) {
    let reply = new Reply({
      text: "test",
      created_on: new Date(),
      reported: false,
      delete_password: "test",
    })
    thread.replies.push(reply)
    thread = await thread.save()
  }
  reply = thread.replies[0];
  return reply
}

let threadId;
let replyId;

suite("Functional Tests", function () {

    test("1. Creating a new thread: POST request to /api/threads/{board}", function (done) {
        chai.request(server)
            .post("/api/threads/test")
            .send({
                board: "test",
                text: "test",
                delete_password: "test",
            })
            .end((err, res) => {
                assert.equal(res.status, 200)
                assert.isDefined(res.body._id)
                assert.isArray(res.body.replies)
                threadId = res.body._id
                
            })
        done();
    })

    test("2. Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}", async function () {
        chai.request(server)
            .get("/api/threads/test")
            .end(function (err, res) {
                assert.equal(res.status, 200)
                assert.isArray(res.body)
                assert.isObject(res.body[0])
                assert.isDefined(res.body[0].text)
                assert.isDefined(res.body[0].created_on)
                assert.isDefined(res.body[0].bumped_on)
                assert.isArray(res.body[0].replies)
                assert.isAtMost(res.body[0].replies.length, 3)
                  })

    })

    test("3. Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password", async function () {
        let thread = await getThreadId(threadId);
        threadId = thread._id.toString();
        chai.request(server)
            .delete("/api/threads/test")
            .send({
                board: "test",
                text: "test",
                thread_id: threadId,
                delete_password: "wrong_password",
            })
            .end(function (err, res) {
                assert.equal(res.status, 200)
                assert.equal(res.text, "incorrect password")
            })
    })

    test("5. Reporting a thread: PUT request to /api/threads/{board}", async function () {
        let thread = await getThreadId("test", "test");
        let thread_id = thread._id.toString()
        chai.request(server)
            .put("/api/threads/test")
            .send({
                board: "test",
                thread_id: thread_id
            })
            .end(function (err, res) {
                assert.equal(res.status, 200)
                assert.equal(res.text, "reported")
            })
    })

    test("6. Creating a new reply: POST request to /api/replies/{board}", async function () {
        let thread = await getThreadId("test", "test");
        let test_thread_id = thread._id.toString()
        chai.request(server)
            .post("/api/replies/test")
            .send({
                text: "test",
                delete_password: "test",
                board: "test",
                thread_id: threadId
            })
            .end(function (err, res) {
                assert.equal(res.status, 200)
                assert.isDefined(res.body._id)
                assert.isArray(res.body.replies)
                assert.isObject(res.body.replies[0])
                assert.isDefined(res.body.replies[0].text)
                assert.isDefined(res.body.replies[0].created_on)
            })
    })

    test("7. Viewing a single thread with all replies: GET request to /api/replies/{board}", async function () {
        let thread = await getThreadId("test", "test");
        let test_thread_id = thread._id.toString()
        chai.request(server)
            .get("/api/replies/test" + "?thread_id=" + threadId)
            .end(function (err, res) {
                assert.equal(res.status, 200)
                assert.isObject(res.body)
                assert.isDefined(res.body.text)
                assert.isDefined(res.body.created_on)
                assert.isDefined(res.body.bumped_on)
                assert.isArray(res.body.replies)
                assert.isObject(res.body.replies[0])
                assert.isDefined(res.body.replies[0].text)
                assert.isDefined(res.body.replies[0].created_on)
            })
     })

    test("8. Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password", async function () {
        let thread = await getThreadId("test", "test")
        let test_thread_id = thread._id.toString()
        let reply = await getReplyId(test_thread_id)
        let test_reply_id = reply._id.toString()
        chai.request(server)
            .delete("/api/replies/test")
            .send({
                thread_id: test_thread_id,
                reply_id: test_reply_id,
                delete_password: "wrong_password",
            })
            .end(function (err, res) {
                assert.equal(res.status, 200)
                assert.equal(res.text, "incorrect password")
            })   
    })

    
    test("9. Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password",  async function () {
        let thread = await getThreadId("test", "test")
        let test_thread_id = thread._id.toString()
        let reply = await getReplyId(test_thread_id)
        let test_reply_id = reply._id.toString()
        chai.request(server)
            .delete("/api/replies/test")
            .send({
                thread_id: test_thread_id,
                reply_id: test_reply_id,
                delete_password: "test",
            })
            .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.equal(res.text, "success");
            });
    });

    test("10. Reporting a reply: PUT request to /api/replies/{board}", async function () {
        let thread = await getThreadId("test", "test")
        let threadId = thread._id.toString()
        let reply = await getReplyId(threadId)
        let replyId = reply._id.toString()
        chai.request(server)
            .put("/api/replies/test")
            .send({
                thread_id: threadId,
                reply_id: replyId,
                board: "test",
            })
            .end(function (err, res) {
                assert.equal(res.text, "reported");
                assert.equal(res.status, 200);
            });
    });

    // 4. needs to be last because it deletes the Thread that the above tests rely on!
    test("4. Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password",  async function () {
        let thread = await getThreadId("test", "test");
        let threadId = thread._id.toString()
        chai.request(server)
            .delete("/api/threads/test")
            .send({
                board: "test",
                text: "test",
                delete_password: "test",
                thread_id: threadId,
            })
            .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.equal(res.text, "success");
            })
    })
});
