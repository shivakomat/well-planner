app.controller('budgetController', function(BudgetFactory, ProjectsFactory) {
    var budgetController = this;
    budgetController.breakDownsLists = {};
    budgetController.projectInfo = {};
    budgetController.isLoaded = false;

    budgetController.editBreakdownItem = function (breakdownItem) {
        budgetController.currentBreakdown = breakdownItem
    };

    budgetController.init = function (businessId, projectId) {
        list(businessId, projectId);
        setProjectInfo(projectId, businessId);
    };

    budgetController.newBreakdownItem = function (parent) {
        budgetController.currentParentBreakdown = parent;
    };

    budgetController.deleteBreakdownItem = function (breakdownItem) {
        BudgetFactory.deleteBreakDown(breakdownItem.project_id, breakdownItem.business_id, breakdownItem.id, function mySuccess() {
            budgetController.init(breakdownItem.project_id, breakdownItem.business_id);
            alerts.autoCloseAlert('success-message', 'Breakdown Item Deleted!!', '');
        }, function myError() {
            alerts.autoCloseAlert('title-and-text', 'Error deleting item', 'Please try again!');
        })
    };

    function setProjectInfo(projectId, businessId) {
        ProjectsFactory.getProject(projectId, businessId, function mySuccess (response) {
            budgetController.projectInfo = response.data.data;
            budgetController.isLoaded = true;
        }, function myError (response) {
            console.log(response.statusText);
            budgetController.projectInfo = {};
        });
    }

    function list(businessId, projectId) {
        BudgetFactory.allBreakdowns(businessId, projectId, function (response) {
            budgetController.breakDownsLists = response.data.data;
            budgetController.breakDownsLists = calcTotalEstimateAndActual(budgetController.breakDownsLists);
            console.log(budgetController.breakDownsLists);
        }, function (response) { console.log(response.statusText);
        })
    }
});

function calcTotalEstimateAndActual(breakdownList) {
    var p;
    var overallEstimate = 0;
    var overallActual = 0;
    for (p = 0; p < breakdownList.length; p++) {
        var x;
        var totalEstimated = 0;
        var totalActual = 0;
        for(x = 0; x < breakdownList[p].subBreakDowns.length; x++) {
            totalEstimated = totalEstimated + breakdownList[p].subBreakDowns[x].estimate
            totalActual = totalActual + breakdownList[p].subBreakDowns[x].actual
        }
        breakdownList[p].totalEstimate =  totalEstimated;
        breakdownList[p].totalActual =  totalActual;
        overallEstimate = overallEstimate + totalEstimated;
        overallActual = overallActual + totalActual;
    }
    breakdownList.overallEstimate = overallEstimate;
    breakdownList.overallActual = overallActual;
    breakdownList.totalSavings = breakdownList.overallEstimate - breakdownList.overallActual;
    return breakdownList;
}

app.directive('newBudgetBreakdownListModal',  [NewBudgetBreakdownListModalDirective]);
function NewBudgetBreakdownListModalDirective() {
    return{
        template:  '<ng-include src="getNewBudgetBreakdownListModalTemplateUrl()"/>',
        scope: false,
        bindToController: {
            businessId: '=',
            projectId: '=',
            breakdownList: '='
        },
        controller: NewBudgetBreakdownListModalController,
        controllerAs: 'newBudgetBreakdownListModalController'
    }
}

app.controller('newBudgetBreakdownListModalController', [NewBudgetBreakdownListModalController]);
function NewBudgetBreakdownListModalController(BudgetFactory, $scope, templates) {
    var newBudgetBreakdownListModalController = this;

    newBudgetBreakdownListModalController.formData = {};

    $scope.getNewBudgetBreakdownListModalTemplateUrl = function () {
        return templates.newBudgetBreakdownListModal;
    };

    newBudgetBreakdownListModalController.createBreakdownList = function () {
        newBreakdownList()
    };

    function newBreakdownList() {
        var breakdownList = {};
        breakdownList = newBudgetBreakdownListModalController.formData;
        breakdownList.business_id = newBudgetBreakdownListModalController.businessId;
        breakdownList.project_id = newBudgetBreakdownListModalController.projectId;
        breakdownList.is_budget_header = true;
        breakdownList.estimate = 0;
        breakdownList.actual = 0;
        breakdownList.parent_budget_id = null;


        BudgetFactory.addBreakDownList(breakdownList, function mySuccess() {
            refresh(newBudgetBreakdownListModalController.businessId, newBudgetBreakdownListModalController.projectId);
            alerts.autoCloseAlert('success-message', 'New list created!!', 'Nice start!');
        }, function myError() {
            alerts.autoCloseAlert('success-message', 'Sorry, unable to create a new list', 'Please try again!');
        });
    }

    function refresh(businessId, projectId) {
        list(businessId, projectId);
        newBudgetBreakdownListModalController.formData = {};
    }

    function list(businessId, projectId) {
        BudgetFactory.allBreakdowns(businessId, projectId, function (response) {
            console.log(response.data.data);
            newBudgetBreakdownListModalController.breakdownList = response.data.data;
            newBudgetBreakdownListModalController.breakdownList = calcTotalEstimateAndActual(newBudgetBreakdownListModalController.breakdownList);
        }, function (response) { console.log(response.statusText);
        })
    }

}

app.directive('newBreakdownModal',  [NewBreakdownModalDirective]);
function NewBreakdownModalDirective() {
    return{
        template:  '<ng-include src="getNewBreakdownItemModalTemplateUrl()"/>',
        scope: false,
        bindToController: {
            businessId: '=',
            projectId: '=',
            parent: '=',
            breakdownList: '='
        },
        controller: NewBreakdownModalController,
        controllerAs: 'newBreakdownModalController'
    }
}



app.controller('newBreakdownModalController', [NewBreakdownModalController]);
function NewBreakdownModalController(BudgetFactory, $scope, templates) {
    var newBreakdownModalController = this;

    newBreakdownModalController.formData = {};

    $scope.getNewBreakdownItemModalTemplateUrl = function () {
        return templates.newBreakdownItemModal;
    };

    newBreakdownModalController.createNewBreakdownItem = function () {
        newBreakdownItem()
    };

    function newBreakdownItem() {
        var breakdownItem = {};
        breakdownItem = newBreakdownModalController.formData;
        breakdownItem.business_id = newBreakdownModalController.businessId;
        breakdownItem.project_id = newBreakdownModalController.projectId;
        breakdownItem.parent_budget_id = newBreakdownModalController.parent.id;
        breakdownItem.actual = 0;
        breakdownItem.is_budget_header = false;

        BudgetFactory.addBreakDownList(breakdownItem, function mySuccess() {
            refresh(newBreakdownModalController.businessId, newBreakdownModalController.projectId);
            alerts.autoCloseAlert('success-message', 'New item created!!', 'Good job!');
        }, function myError() {
            alerts.autoCloseAlert('success-message', 'Sorry, unable to create breakdown item', 'Please try again!');
        });
    }

    function refresh(businessId, projectId) {
        newBreakdownModalController.formData = {};
        list(businessId, projectId);
    }

    function list(businessId, projectId) {
        BudgetFactory.allBreakdowns(businessId, projectId, function (response) {
            newBreakdownModalController.breakdownList = response.data.data;
            newBreakdownModalController.breakdownList = calcTotalEstimateAndActual(newBreakdownModalController.breakdownList);
        }, function (response) {
            console.log(response.statusText);
        })
    }

}

app.directive('editBreakdownModal',  [EditBreakDownModalDirective]);
function EditBreakDownModalDirective() {
    return{
        template:  '<ng-include src="getEditBreakdownItemModalTemplateUrl()"/>',
        scope: false,
        bindToController: {
            businessId: '=',
            projectId: '=',
            currentBreakdownItem: '=',
            breakdownList: '='
        },
        controller: EditBreakdownModalController,
        controllerAs: 'editBreakdownItemModalController'
    }
}

app.controller('editBreakdownItemModalController', [EditBreakdownModalController]);
function EditBreakdownModalController(BudgetFactory, $scope, templates) {
    var editBreakdownItemModalController = this;

    $scope.getEditBreakdownItemModalTemplateUrl = function () {
        return templates.editBreakdownItemModal;
    };

    editBreakdownItemModalController.close = function () {
        list(editBreakdownItemModalController.businessId, editBreakdownItemModalController.projectId);
    };

    editBreakdownItemModalController.updateItem = function () {
        console.log(editBreakdownItemModalController.currentBreakdownItem);
        updateBreakDown(editBreakdownItemModalController.currentBreakdownItem, "Breakdown Item updated!", "Woo hoo!");
    };

    function updateBreakDown(updatedBreakdownItem, msg, msgDesc) {
        BudgetFactory.updateBreakdownItemBy(updatedBreakdownItem,
            function mySuccess() {
                alerts.autoCloseAlert('success-message', msg, msgDesc);
                list(editBreakdownItemModalController.businessId, editBreakdownItemModalController.projectId);
            }, function myError() {
                alerts.autoCloseAlert('success-message', 'Error updating breakdown item amounts', 'Please try again!');
            })
    }

    function list(businessId, projectId) {
        BudgetFactory.allBreakdowns(businessId, projectId, function (response) {
            editBreakdownItemModalController.breakdownList = response.data.data;
            editBreakdownItemModalController.breakdownList = calcTotalEstimateAndActual(editBreakdownItemModalController.breakdownList);
        }, function (response) {
            console.log(response.statusText);
        })
    }
}

app.directive('deleteBreakdownItemModal',  [DeleteBreakdownListModalDirective]);
function DeleteBreakdownListModalDirective() {
    return{
        template:  '<ng-include src="getDeleteBreakdownModalUrl()"/>',
        scope: false,
        bindToController: {
            businessId: '=',
            projectId: '=',
            tasks: '='
        },
        controller: DeleteBreakdownItemModalController,
        controllerAs: 'deleteBreakdownItemModalController'
    }
}

app.controller('deleteBreakdownItemModalController', [DeleteBreakdownItemModalController]);
function DeleteBreakdownItemModalController(BudgetFactory, $scope, templates) {
    var deleteBreakdownItemModalController = this;
    deleteBreakdownItemModalController.formData = {};
    deleteBreakdownItemModalController.breakDownsLists = [];

    $scope.getDeleteBreakdownModalUrl = function () {
        return templates.deleteTaskListModal;
    };

    deleteBreakdownItemModalController.deleteBreakdownList = function () {
        deleteBreakdownList(deleteBreakdownItemModalController.businessId, deleteBreakdownItemModalController.projectId, deleteBreakdownItemModalController.formData.taskToDelete.parent.id)
    };

    function deleteBreakdownList(businessId, projectId, breakDownListId) {
        BudgetFactory.deleteBreakDownListBy(projectId, businessId, breakDownListId, function mySuccess() {
            refresh(businessId, projectId);
            alerts.autoCloseAlert('success-message', "Task deleted successfully!", "Nice!");
        }, function myError() {
            alerts.autoCloseAlert('success-message', 'Error updating task', 'Please try again!');
        });
    }

    function refresh(businessId, projectId) {
        newBreakdownModalController.formData = {};
        list(businessId, projectId);
    }

    function list(businessId, projectId) {
        BudgetFactory.allBreakdowns(businessId, projectId, function (response) {
            console.log(response.data.data); deleteBreakdownItemModalController.breakDownsLists = response.data.data;
           }, function (response) { console.log(response.statusText);
        })
    }
}
