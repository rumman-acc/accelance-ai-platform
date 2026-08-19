"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mariadbMigrations = void 0;
const _1693840429259_Init_1 = require("./1693840429259-Init");
const _1693997791471_ModifyChatFlow_1 = require("./1693997791471-ModifyChatFlow");
const _1693999022236_ModifyChatMessage_1 = require("./1693999022236-ModifyChatMessage");
const _1693999261583_ModifyCredential_1 = require("./1693999261583-ModifyCredential");
const _1694001465232_ModifyTool_1 = require("./1694001465232-ModifyTool");
const _1694099200729_AddApiConfig_1 = require("./1694099200729-AddApiConfig");
const _1694432361423_AddAnalytic_1 = require("./1694432361423-AddAnalytic");
const _1694658767766_AddChatHistory_1 = require("./1694658767766-AddChatHistory");
const _1699325775451_AddAssistantEntity_1 = require("./1699325775451-AddAssistantEntity");
const _1699481607341_AddUsedToolsToChatMessage_1 = require("./1699481607341-AddUsedToolsToChatMessage");
const _1699900910291_AddCategoryToChatFlow_1 = require("./1699900910291-AddCategoryToChatFlow");
const _1700271021237_AddFileAnnotationsToChatMessage_1 = require("./1700271021237-AddFileAnnotationsToChatMessage");
const _1701788586491_AddFileUploadsToChatMessage_1 = require("./1701788586491-AddFileUploadsToChatMessage");
const _1702200925471_AddVariableEntity_1 = require("./1702200925471-AddVariableEntity");
const _1706364937060_AddSpeechToText_1 = require("./1706364937060-AddSpeechToText");
const _1707213626553_AddFeedback_1 = require("./1707213626553-AddFeedback");
const _1709814301358_AddUpsertHistoryEntity_1 = require("./1709814301358-AddUpsertHistoryEntity");
const _1710832127079_AddLead_1 = require("./1710832127079-AddLead");
const _1711538023578_AddLeadToChatMessage_1 = require("./1711538023578-AddLeadToChatMessage");
const _1711637331047_AddDocumentStore_1 = require("./1711637331047-AddDocumentStore");
const _1714548873039_AddEvaluation_1 = require("./1714548873039-AddEvaluation");
const _1714548903384_AddDataset_1 = require("./1714548903384-AddDataset");
const _1714679514451_AddAgentReasoningToChatMessage_1 = require("./1714679514451-AddAgentReasoningToChatMessage");
const _1714808591644_AddEvaluator_1 = require("./1714808591644-AddEvaluator");
const _1715861032479_AddVectorStoreConfigToDocStore_1 = require("./1715861032479-AddVectorStoreConfigToDocStore");
const _1716300000000_AddTypeToChatFlow_1 = require("./1716300000000-AddTypeToChatFlow");
const _1720230151480_AddApiKey_1 = require("./1720230151480-AddApiKey");
const _1721078251523_AddActionToChatMessage_1 = require("./1721078251523-AddActionToChatMessage");
const _1722301395521_LongTextColumn_1 = require("./1722301395521-LongTextColumn");
const _1725629836652_AddCustomTemplate_1 = require("./1725629836652-AddCustomTemplate");
const _1726156258465_AddArtifactsToChatMessage_1 = require("./1726156258465-AddArtifactsToChatMessage");
const _1726666318346_AddFollowUpPrompts_1 = require("./1726666318346-AddFollowUpPrompts");
const _1733011290987_AddTypeToAssistant_1 = require("./1733011290987-AddTypeToAssistant");
const _1733752119696_AddSeqNoToDatasetRow_1 = require("./1733752119696-AddSeqNoToDatasetRow");
const _1738090872625_AddExecutionEntity_1 = require("./1738090872625-AddExecutionEntity");
const _1743758056188_FixOpenSourceAssistantTable_1 = require("./1743758056188-FixOpenSourceAssistantTable");
const _1744964560174_AddErrorToEvaluationRun_1 = require("./1744964560174-AddErrorToEvaluationRun");
const _1747902489801_ModifyExecutionDataColumnType_1 = require("./1747902489801-ModifyExecutionDataColumnType");
const _1754986457485_AddTextToSpeechToChatFlow_1 = require("./1754986457485-AddTextToSpeechToChatFlow");
const _1755066758601_ModifyChatflowType_1 = require("./1755066758601-ModifyChatflowType");
const _1759419231100_AddTextToSpeechToChatFlow_1 = require("./1759419231100-AddTextToSpeechToChatFlow");
const _1759424809984_AddChatFlowNameIndex_1 = require("./1759424809984-AddChatFlowNameIndex");
const _1765000000000_FixDocumentStoreFileChunkLongText_1 = require("./1765000000000-FixDocumentStoreFileChunkLongText");
const _1765360298674_AddApiKeyPermission_1 = require("./1765360298674-AddApiKeyPermission");
const _1764759496768_AddReasonContentToChatMessage_1 = require("./1764759496768-AddReasonContentToChatMessage");
const _1766000000000_AddCustomMcpServer_1 = require("./1766000000000-AddCustomMcpServer");
const _1776240000003_AddWebhookSecretToChatFlow_1 = require("./1776240000003-AddWebhookSecretToChatFlow");
const _1778000000002_AddUserIdToExecution_1 = require("./1778000000002-AddUserIdToExecution");
const _1779000000002_AddCreatedByToCredential_1 = require("./1779000000002-AddCreatedByToCredential");
const _1780000000002_AddCredentialAccessEntity_1 = require("./1780000000002-AddCredentialAccessEntity");
const _1781000000002_AddAgentToolPolicyEntity_1 = require("./1781000000002-AddAgentToolPolicyEntity");
const _1782000000002_AddToolCallAuditEntity_1 = require("./1782000000002-AddToolCallAuditEntity");
const _1783000000002_AddGuardrailCatalogItemEntity_1 = require("./1783000000002-AddGuardrailCatalogItemEntity");
const _1784000000002_AddGuardrailPolicyEntity_1 = require("./1784000000002-AddGuardrailPolicyEntity");
const _1785000000002_AddGuardrailCatalogItemBatch2_1 = require("./1785000000002-AddGuardrailCatalogItemBatch2");
const _1786000000002_GuardrailCatalogBatch3Enforcement_1 = require("./1786000000002-GuardrailCatalogBatch3Enforcement");
const _1787000000002_AddAuditLogEntity_1 = require("./1787000000002-AddAuditLogEntity");
const _1788000000002_FixContentModerationNodeNames_1 = require("./1788000000002-FixContentModerationNodeNames");
const _1767000000000_AddMcpServerConfigToChatFlow_1 = require("./1767000000000-AddMcpServerConfigToChatFlow");
const _1772000000000_AddScheduleEntities_1 = require("./1772000000000-AddScheduleEntities");
const _1720230151482_AddAuthTables_1 = require("../../../enterprise/database/migrations/mariadb/1720230151482-AddAuthTables");
const _1725437498242_AddWorkspace_1 = require("../../../enterprise/database/migrations/mariadb/1725437498242-AddWorkspace");
const _1726654922034_AddWorkspaceShared_1 = require("../../../enterprise/database/migrations/mariadb/1726654922034-AddWorkspaceShared");
const _1726655750383_AddWorkspaceIdToCustomTemplate_1 = require("../../../enterprise/database/migrations/mariadb/1726655750383-AddWorkspaceIdToCustomTemplate");
const _1727798417345_AddOrganization_1 = require("../../../enterprise/database/migrations/mariadb/1727798417345-AddOrganization");
const _1729130948686_LinkWorkspaceId_1 = require("../../../enterprise/database/migrations/mariadb/1729130948686-LinkWorkspaceId");
const _1729133111652_LinkOrganizationId_1 = require("../../../enterprise/database/migrations/mariadb/1729133111652-LinkOrganizationId");
const _1730519457880_AddSSOColumns_1 = require("../../../enterprise/database/migrations/mariadb/1730519457880-AddSSOColumns");
const _1734074497540_AddPersonalWorkspace_1 = require("../../../enterprise/database/migrations/mariadb/1734074497540-AddPersonalWorkspace");
const _1737076223692_RefactorEnterpriseDatabase_1 = require("../../../enterprise/database/migrations/mariadb/1737076223692-RefactorEnterpriseDatabase");
const _1746862866554_ExecutionLinkWorkspaceId_1 = require("../../../enterprise/database/migrations/mariadb/1746862866554-ExecutionLinkWorkspaceId");
exports.mariadbMigrations = [
    _1693840429259_Init_1.Init1693840429259,
    _1693997791471_ModifyChatFlow_1.ModifyChatFlow1693997791471,
    _1693999022236_ModifyChatMessage_1.ModifyChatMessage1693999022236,
    _1693999261583_ModifyCredential_1.ModifyCredential1693999261583,
    _1694001465232_ModifyTool_1.ModifyTool1694001465232,
    _1694099200729_AddApiConfig_1.AddApiConfig1694099200729,
    _1694432361423_AddAnalytic_1.AddAnalytic1694432361423,
    _1694658767766_AddChatHistory_1.AddChatHistory1694658767766,
    _1699325775451_AddAssistantEntity_1.AddAssistantEntity1699325775451,
    _1699481607341_AddUsedToolsToChatMessage_1.AddUsedToolsToChatMessage1699481607341,
    _1699900910291_AddCategoryToChatFlow_1.AddCategoryToChatFlow1699900910291,
    _1700271021237_AddFileAnnotationsToChatMessage_1.AddFileAnnotationsToChatMessage1700271021237,
    _1702200925471_AddVariableEntity_1.AddVariableEntity1699325775451,
    _1701788586491_AddFileUploadsToChatMessage_1.AddFileUploadsToChatMessage1701788586491,
    _1706364937060_AddSpeechToText_1.AddSpeechToText1706364937060,
    _1709814301358_AddUpsertHistoryEntity_1.AddUpsertHistoryEntity1709814301358,
    _1707213626553_AddFeedback_1.AddFeedback1707213626553,
    _1711637331047_AddDocumentStore_1.AddDocumentStore1711637331047,
    _1710832127079_AddLead_1.AddLead1710832127079,
    _1711538023578_AddLeadToChatMessage_1.AddLeadToChatMessage1711538023578,
    _1714548873039_AddEvaluation_1.AddEvaluation1714548873039,
    _1714548903384_AddDataset_1.AddDatasets1714548903384,
    _1714679514451_AddAgentReasoningToChatMessage_1.AddAgentReasoningToChatMessage1714679514451,
    _1714808591644_AddEvaluator_1.AddEvaluator1714808591644,
    _1715861032479_AddVectorStoreConfigToDocStore_1.AddVectorStoreConfigToDocStore1715861032479,
    _1716300000000_AddTypeToChatFlow_1.AddTypeToChatFlow1716300000000,
    _1720230151480_AddApiKey_1.AddApiKey1720230151480,
    _1721078251523_AddActionToChatMessage_1.AddActionToChatMessage1721078251523,
    _1722301395521_LongTextColumn_1.LongTextColumn1722301395521,
    _1725629836652_AddCustomTemplate_1.AddCustomTemplate1725629836652,
    _1726666318346_AddFollowUpPrompts_1.AddFollowUpPrompts1726666318346,
    _1733011290987_AddTypeToAssistant_1.AddTypeToAssistant1733011290987,
    _1726156258465_AddArtifactsToChatMessage_1.AddArtifactsToChatMessage1726156258465,
    _1720230151482_AddAuthTables_1.AddAuthTables1720230151482,
    _1725437498242_AddWorkspace_1.AddWorkspace1725437498242,
    _1726654922034_AddWorkspaceShared_1.AddWorkspaceShared1726654922034,
    _1726655750383_AddWorkspaceIdToCustomTemplate_1.AddWorkspaceIdToCustomTemplate1726655750383,
    _1727798417345_AddOrganization_1.AddOrganization1727798417345,
    _1729130948686_LinkWorkspaceId_1.LinkWorkspaceId1729130948686,
    _1729133111652_LinkOrganizationId_1.LinkOrganizationId1729133111652,
    _1730519457880_AddSSOColumns_1.AddSSOColumns1730519457880,
    _1733752119696_AddSeqNoToDatasetRow_1.AddSeqNoToDatasetRow1733752119696,
    _1734074497540_AddPersonalWorkspace_1.AddPersonalWorkspace1734074497540,
    _1737076223692_RefactorEnterpriseDatabase_1.RefactorEnterpriseDatabase1737076223692,
    _1738090872625_AddExecutionEntity_1.AddExecutionEntity1738090872625,
    _1743758056188_FixOpenSourceAssistantTable_1.FixOpenSourceAssistantTable1743758056188,
    _1744964560174_AddErrorToEvaluationRun_1.AddErrorToEvaluationRun1744964560174,
    _1746862866554_ExecutionLinkWorkspaceId_1.ExecutionLinkWorkspaceId1746862866554,
    _1747902489801_ModifyExecutionDataColumnType_1.ModifyExecutionDataColumnType1747902489801,
    _1754986457485_AddTextToSpeechToChatFlow_1.AddTextToSpeechToChatFlow1754986457485,
    _1755066758601_ModifyChatflowType_1.ModifyChatflowType1755066758601,
    _1759419231100_AddTextToSpeechToChatFlow_1.AddTextToSpeechToChatFlow1759419231100,
    _1759424809984_AddChatFlowNameIndex_1.AddChatFlowNameIndex1759424809984,
    _1765000000000_FixDocumentStoreFileChunkLongText_1.FixDocumentStoreFileChunkLongText1765000000000,
    _1765360298674_AddApiKeyPermission_1.AddApiKeyPermission1765360298674,
    _1764759496768_AddReasonContentToChatMessage_1.AddReasonContentToChatMessage1764759496768,
    _1766000000000_AddCustomMcpServer_1.AddCustomMcpServer1766000000000,
    _1776240000003_AddWebhookSecretToChatFlow_1.AddWebhookSecretToChatFlow1776240000003,
    _1778000000002_AddUserIdToExecution_1.AddUserIdToExecution1778000000002,
    _1779000000002_AddCreatedByToCredential_1.AddCreatedByToCredential1779000000002,
    _1780000000002_AddCredentialAccessEntity_1.AddCredentialAccessEntity1780000000002,
    _1781000000002_AddAgentToolPolicyEntity_1.AddAgentToolPolicyEntity1781000000002,
    _1782000000002_AddToolCallAuditEntity_1.AddToolCallAuditEntity1782000000002,
    _1783000000002_AddGuardrailCatalogItemEntity_1.AddGuardrailCatalogItemEntity1783000000002,
    _1784000000002_AddGuardrailPolicyEntity_1.AddGuardrailPolicyEntity1784000000002,
    _1785000000002_AddGuardrailCatalogItemBatch2_1.AddGuardrailCatalogItemBatch2_1785000000002,
    _1786000000002_GuardrailCatalogBatch3Enforcement_1.GuardrailCatalogBatch3Enforcement1786000000002,
    _1787000000002_AddAuditLogEntity_1.AddAuditLogEntity1787000000002,
    _1788000000002_FixContentModerationNodeNames_1.FixContentModerationNodeNames1788000000002,
    _1767000000000_AddMcpServerConfigToChatFlow_1.AddMcpServerConfigToChatFlow1767000000000,
    _1772000000000_AddScheduleEntities_1.AddScheduleEntities1772000000000
];
//# sourceMappingURL=index.js.map