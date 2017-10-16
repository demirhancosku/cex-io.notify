const ExampleController = require("./Controller/ExampleController");

module.exports = () => {

    /**
     * GET Example LISTS
     */
    global.server.get('/example/lists', ExampleController.getExampleList);


    /**
     * POST Example LIST
     */
    global.server.post('/example/list' ,ExampleController.postExample)


}