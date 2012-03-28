(function(Tasks) {
    Tasks.Router = Backbone.Router.extend({
        routes: {
            "": "index"
        },

        index: function() {
            new Tasks.Views.AddTaskView().show();
            new Tasks.Views.ListView().show();
        }
    });

    Tasks.Task = Backbone.Model.extend({
        defaults: function() {
            return {
                content: "What do you want to do today?",
                order: 1,
                done: false
            }
        },
        toggle: function() {
            this.save({done: !this.get("done")});
        }
    });
    Tasks.TaskList = Backbone.Collection.extend({
        model: Tasks.Task,
        localStorage: new Store("tasks"),
        nextId: function() {
            if (!this.length) return 1;
            return this.last().get('order') + 1;
        }
    });

    Tasks.Views.AsyncLiquidView = Backbone.View.extend({
        $tag: null,
        templateFile:null,
        context: {},
        render: function() {
            namespace.fetchTemplate(this.templateFile, _.bind(function(content) {
                var output = this.composeTemplate(content(), this.context);
                this.$tag.html(output);
            }, this));
        },

        composeTemplate: function (template, context) {
            if (typeof context == "undefined") {
                context = {};
            }
            return Liquid.parse(template).render(context);
        }
    });
    Tasks.Views.AddTaskView = Tasks.Views.AsyncLiquidView.extend({
        templateFile: "app/modules/tasks/templates/add.html",
        $tag: $("#create-task"),

        initialize: function() {
            $("#new-todo").live("keypress", this.newTodo);
            _.bindAll(this, "newTodo");
        },

        newTodo: function(e) {
            if (e.keyCode != 13) return;
            var content = $(e.currentTarget).val();
            var order = namespace.tasks.length + 1;
            var t = new Tasks.Task({"content": content, "order": order});
            namespace.tasks.create(t);
            $(e.currentTarget).val('');
        },

        show: function() {
            this.render();
        }
    });

    Tasks.Views.ListView = Tasks.Views.AsyncLiquidView.extend({
        $tag: $("#task-list"),
        collection: new Tasks.TaskList(),
        templateFile: "app/modules/tasks/templates/list.html",
        events: {
            "click .todo-destroy": "clearTask"
        },

        clearTask: function(e) {
          var id = $(e.currentTarget).attr("data-model-id");
          namespace.tasks.get(id).destroy();
        },

        toggleTask: function(e) {
            var id = $(e.currentTarget).attr("id");
            namespace.tasks.get(id).toggle();

        },

        initialize: function() {
            this.collection = namespace.tasks;
            this.collection.fetch();
            namespace.tasks.on("add", _.bind(function() {this.show();}, this));
            namespace.tasks.on("reset", _.bind(function() {this.show();}, this));
            namespace.tasks.on("remove", _.bind(function() {this.show();}, this));
            namespace.tasks.on("change", _.bind(function() {this.show();}, this));
            _.bindAll(this, "show");
            $('.todo-destroy').live("click", this.clearTask);
            $('.check').live("click", this.toggleTask);
        },

        show: function() {
            this.context.tasks = namespace.tasks.toArray();
            this.render();
        }
    });
})(namespace.module("tasks"));
