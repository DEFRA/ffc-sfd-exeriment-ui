const { urlPrefix } = require("../config/server");
const viewTemplate = "choose-organisation";
const currentPath = `${urlPrefix}/${viewTemplate}`;
const {
  setYarValue,
  getYarValue,
  SESSION_KEYS,
} = require("../helpers/session");
const { questionBank } = require("../config/question-bank");
const { drawSectionGetRequests, drawSectionPostRequests } = require("./index");

global.addedGrantIDs = global.addedGrantIDs || [];

const FARM_NAMES = {
  908789876: "Sarah's Farm",
  106846848: "Jim's Farm",
};

function createModel() {
  const model = {
    formActionPage: currentPath,
    radioInput: {
      name: "selectedSBI",
      fieldset: {
        legend: {
          text: "Choose demonstration scenario",
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l",
        },
      },
      items: [],
      id: "chooseScenario",
    },
  };

  model.radioInput.items = [
    {
      value: "908789876",
      text: FARM_NAMES["908789876"],
      hint: {
        text: "Sarah does not have any existing agreements in place and she wishes to apply for one farming incentive on one piece of her land.",
      },
    },
    {
      value: "106846848",
      text: FARM_NAMES["106846848"],
      hint: {
        text: "Jim would like to add action(s) to a land parcel that already has a Countryside Stewardship agreement in place.",
      },
    },
  ];

  return model;
}

module.exports = [
  {
    method: "GET",
    path: currentPath,
    options: {
      auth: false,
    },
    handler: (request, h) => {
      return h.view(viewTemplate, createModel());
    },
  },
  {
    method: "POST",
    path: currentPath,
    options: {
      auth: false,
    },
    handler: (request, h) => {
      if (!request.payload.selectedSBI) {
        const currentModel = createModel();
        return h.view(viewTemplate, {
          ...currentModel,
          errorList: [
            {
              text: "Please select a scenario",
              href: "#chooseScenario",
            },
          ],
        });
      }
      const farmName = FARM_NAMES[request.payload.selectedSBI];
      setYarValue(
        request,
        SESSION_KEYS.SELECTED_ORG,
        request.payload.selectedSBI
      );
      setYarValue(request, SESSION_KEYS.APPLICANT_NAME, farmName);
      setYarValue(request, SESSION_KEYS.SELECTED_FARM_NAME, farmName);
      const grantID = "a01WT00001tGtA2YAK";
      const questionBankData = questionBank;
      if (!getYarValue(request, "grant-information")) {
        setYarValue(request, "grant-information", questionBankData);
        const allQuestions = [];
        questionBankData.themes.forEach(({ questions }) => {
          allQuestions.push(...questions);
        });
        setYarValue(request, "grant-questions", allQuestions);
        if (!global.addedGrantIDs.includes(grantID)) {
          const pages = questionBankData.themes
            .map((section) => drawSectionGetRequests(section, grantID))[0]
            .concat(
              questionBankData.themes.map((section) =>
                drawSectionPostRequests(section, grantID)
              )[0]
            );
          request.server.route(pages);
          global.addedGrantIDs.push(grantID);
        }
      }
      const startUrl = questionBankData.themes[0].questions.find(
        (theme) => theme.journeyStart
      ).url;
      return h.redirect(`${urlPrefix}/${grantID}/${startUrl}`);
    },
  },
];
