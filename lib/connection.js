"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _crypto = _interopRequireDefault(require("crypto"));
var _os = _interopRequireDefault(require("os"));
var tls = _interopRequireWildcard(require("tls"));
var net = _interopRequireWildcard(require("net"));
var _dns = _interopRequireDefault(require("dns"));
var _constants = _interopRequireDefault(require("constants"));
var _stream = require("stream");
var _identity = require("@azure/identity");
var _bulkLoad = _interopRequireDefault(require("./bulk-load"));
var _debug = _interopRequireDefault(require("./debug"));
var _events = require("events");
var _instanceLookup = require("./instance-lookup");
var _transientErrorLookup = require("./transient-error-lookup");
var _packet = require("./packet");
var _preloginPayload = _interopRequireDefault(require("./prelogin-payload"));
var _login7Payload = _interopRequireDefault(require("./login7-payload"));
var _ntlmPayload = _interopRequireDefault(require("./ntlm-payload"));
var _request = _interopRequireDefault(require("./request"));
var _rpcrequestPayload = _interopRequireDefault(require("./rpcrequest-payload"));
var _sqlbatchPayload = _interopRequireDefault(require("./sqlbatch-payload"));
var _messageIo = _interopRequireDefault(require("./message-io"));
var _tokenStreamParser = require("./token/token-stream-parser");
var _transaction = require("./transaction");
var _errors = require("./errors");
var _connector = require("./connector");
var _library = require("./library");
var _tdsVersions = require("./tds-versions");
var _message = _interopRequireDefault(require("./message"));
var _ntlm = require("./ntlm");
var _nodeAbortController = require("node-abort-controller");
var _dataType = require("./data-type");
var _bulkLoadPayload = require("./bulk-load-payload");
var _specialStoredProcedure = _interopRequireDefault(require("./special-stored-procedure"));
var _esAggregateError = _interopRequireDefault(require("es-aggregate-error"));
var _package = require("../package.json");
var _url = require("url");
var _handler = require("./token/handler");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// eslint-disable-next-line @typescript-eslint/no-unused-vars

/**
 * @private
 */
const KEEP_ALIVE_INITIAL_DELAY = 30 * 1000;
/**
 * @private
 */
const DEFAULT_CONNECT_TIMEOUT = 15 * 1000;
/**
 * @private
 */
const DEFAULT_CLIENT_REQUEST_TIMEOUT = 15 * 1000;
/**
 * @private
 */
const DEFAULT_CANCEL_TIMEOUT = 5 * 1000;
/**
 * @private
 */
const DEFAULT_CONNECT_RETRY_INTERVAL = 500;
/**
 * @private
 */
const DEFAULT_PACKET_SIZE = 4 * 1024;
/**
 * @private
 */
const DEFAULT_TEXTSIZE = 2147483647;
/**
 * @private
 */
const DEFAULT_DATEFIRST = 7;
/**
 * @private
 */
const DEFAULT_PORT = 1433;
/**
 * @private
 */
const DEFAULT_TDS_VERSION = '7_4';
/**
 * @private
 */
const DEFAULT_LANGUAGE = 'us_english';
/**
 * @private
 */
const DEFAULT_DATEFORMAT = 'mdy';

/**
 * @private
 */

/**
 * @private
 */
const CLEANUP_TYPE = {
  NORMAL: 0,
  REDIRECT: 1,
  RETRY: 2
};
/**
 * A [[Connection]] instance represents a single connection to a database server.
 *
 * ```js
 * var Connection = require('tedious').Connection;
 * var config = {
 *  "authentication": {
 *    ...,
 *    "options": {...}
 *  },
 *  "options": {...}
 * };
 * var connection = new Connection(config);
 * ```
 *
 * Only one request at a time may be executed on a connection. Once a [[Request]]
 * has been initiated (with [[Connection.callProcedure]], [[Connection.execSql]],
 * or [[Connection.execSqlBatch]]), another should not be initiated until the
 * [[Request]]'s completion callback is called.
 */
class Connection extends _events.EventEmitter {
  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */
  _cancelAfterRequestSent;

  /**
   * @private
   */

  /**
   * Note: be aware of the different options field:
   * 1. config.authentication.options
   * 2. config.options
   *
   * ```js
   * const { Connection } = require('tedious');
   *
   * const config = {
   *  "authentication": {
   *    ...,
   *    "options": {...}
   *  },
   *  "options": {...}
   * };
   *
   * const connection = new Connection(config);
   * ```
   *
   * @param config
   */
  constructor(config) {
    super();
    if (typeof config !== 'object' || config === null) {
      throw new TypeError('The "config" argument is required and must be of type Object.');
    }
    if (typeof config.server !== 'string') {
      throw new TypeError('The "config.server" property is required and must be of type string.');
    }
    this.fedAuthRequired = false;
    let authentication;
    if (config.authentication !== undefined) {
      if (typeof config.authentication !== 'object' || config.authentication === null) {
        throw new TypeError('The "config.authentication" property must be of type Object.');
      }
      const type = config.authentication.type;
      const options = config.authentication.options === undefined ? {} : config.authentication.options;
      if (typeof type !== 'string') {
        throw new TypeError('The "config.authentication.type" property must be of type string.');
      }
      if (type !== 'default' && type !== 'ntlm' && type !== 'azure-active-directory-password' && type !== 'azure-active-directory-access-token' && type !== 'azure-active-directory-msi-vm' && type !== 'azure-active-directory-msi-app-service' && type !== 'azure-active-directory-service-principal-secret' && type !== 'azure-active-directory-default') {
        throw new TypeError('The "type" property must one of "default", "ntlm", "azure-active-directory-password", "azure-active-directory-access-token", "azure-active-directory-default", "azure-active-directory-msi-vm" or "azure-active-directory-msi-app-service" or "azure-active-directory-service-principal-secret".');
      }
      if (typeof options !== 'object' || options === null) {
        throw new TypeError('The "config.authentication.options" property must be of type object.');
      }
      if (type === 'ntlm') {
        if (typeof options.domain !== 'string') {
          throw new TypeError('The "config.authentication.options.domain" property must be of type string.');
        }
        if (options.userName !== undefined && typeof options.userName !== 'string') {
          throw new TypeError('The "config.authentication.options.userName" property must be of type string.');
        }
        if (options.password !== undefined && typeof options.password !== 'string') {
          throw new TypeError('The "config.authentication.options.password" property must be of type string.');
        }
        authentication = {
          type: 'ntlm',
          options: {
            userName: options.userName,
            password: options.password,
            domain: options.domain && options.domain.toUpperCase()
          }
        };
      } else if (type === 'azure-active-directory-password') {
        if (typeof options.clientId !== 'string') {
          throw new TypeError('The "config.authentication.options.clientId" property must be of type string.');
        }
        if (options.userName !== undefined && typeof options.userName !== 'string') {
          throw new TypeError('The "config.authentication.options.userName" property must be of type string.');
        }
        if (options.password !== undefined && typeof options.password !== 'string') {
          throw new TypeError('The "config.authentication.options.password" property must be of type string.');
        }
        if (options.tenantId !== undefined && typeof options.tenantId !== 'string') {
          throw new TypeError('The "config.authentication.options.tenantId" property must be of type string.');
        }
        authentication = {
          type: 'azure-active-directory-password',
          options: {
            userName: options.userName,
            password: options.password,
            tenantId: options.tenantId,
            clientId: options.clientId
          }
        };
      } else if (type === 'azure-active-directory-access-token') {
        if (typeof options.token !== 'string') {
          throw new TypeError('The "config.authentication.options.token" property must be of type string.');
        }
        authentication = {
          type: 'azure-active-directory-access-token',
          options: {
            token: options.token
          }
        };
      } else if (type === 'azure-active-directory-msi-vm') {
        if (options.clientId !== undefined && typeof options.clientId !== 'string') {
          throw new TypeError('The "config.authentication.options.clientId" property must be of type string.');
        }
        authentication = {
          type: 'azure-active-directory-msi-vm',
          options: {
            clientId: options.clientId
          }
        };
      } else if (type === 'azure-active-directory-default') {
        if (options.clientId !== undefined && typeof options.clientId !== 'string') {
          throw new TypeError('The "config.authentication.options.clientId" property must be of type string.');
        }
        authentication = {
          type: 'azure-active-directory-default',
          options: {
            clientId: options.clientId
          }
        };
      } else if (type === 'azure-active-directory-msi-app-service') {
        if (options.clientId !== undefined && typeof options.clientId !== 'string') {
          throw new TypeError('The "config.authentication.options.clientId" property must be of type string.');
        }
        authentication = {
          type: 'azure-active-directory-msi-app-service',
          options: {
            clientId: options.clientId
          }
        };
      } else if (type === 'azure-active-directory-service-principal-secret') {
        if (typeof options.clientId !== 'string') {
          throw new TypeError('The "config.authentication.options.clientId" property must be of type string.');
        }
        if (typeof options.clientSecret !== 'string') {
          throw new TypeError('The "config.authentication.options.clientSecret" property must be of type string.');
        }
        if (typeof options.tenantId !== 'string') {
          throw new TypeError('The "config.authentication.options.tenantId" property must be of type string.');
        }
        authentication = {
          type: 'azure-active-directory-service-principal-secret',
          options: {
            clientId: options.clientId,
            clientSecret: options.clientSecret,
            tenantId: options.tenantId
          }
        };
      } else {
        if (options.userName !== undefined && typeof options.userName !== 'string') {
          throw new TypeError('The "config.authentication.options.userName" property must be of type string.');
        }
        if (options.password !== undefined && typeof options.password !== 'string') {
          throw new TypeError('The "config.authentication.options.password" property must be of type string.');
        }
        authentication = {
          type: 'default',
          options: {
            userName: options.userName,
            password: options.password
          }
        };
      }
    } else {
      authentication = {
        type: 'default',
        options: {
          userName: undefined,
          password: undefined
        }
      };
    }
    this.config = {
      server: config.server,
      authentication: authentication,
      options: {
        abortTransactionOnError: false,
        appName: undefined,
        camelCaseColumns: false,
        cancelTimeout: DEFAULT_CANCEL_TIMEOUT,
        columnEncryptionKeyCacheTTL: 2 * 60 * 60 * 1000,
        // Units: milliseconds
        columnEncryptionSetting: false,
        columnNameReplacer: undefined,
        connectionRetryInterval: DEFAULT_CONNECT_RETRY_INTERVAL,
        connectTimeout: DEFAULT_CONNECT_TIMEOUT,
        connector: undefined,
        connectionIsolationLevel: _transaction.ISOLATION_LEVEL.READ_COMMITTED,
        cryptoCredentialsDetails: {},
        database: undefined,
        datefirst: DEFAULT_DATEFIRST,
        dateFormat: DEFAULT_DATEFORMAT,
        debug: {
          data: false,
          packet: false,
          payload: false,
          token: false
        },
        enableAnsiNull: true,
        enableAnsiNullDefault: true,
        enableAnsiPadding: true,
        enableAnsiWarnings: true,
        enableArithAbort: true,
        enableConcatNullYieldsNull: true,
        enableCursorCloseOnCommit: null,
        enableImplicitTransactions: false,
        enableNumericRoundabort: false,
        enableQuotedIdentifier: true,
        encrypt: true,
        fallbackToDefaultDb: false,
        encryptionKeyStoreProviders: undefined,
        instanceName: undefined,
        isolationLevel: _transaction.ISOLATION_LEVEL.READ_COMMITTED,
        language: DEFAULT_LANGUAGE,
        localAddress: undefined,
        maxRetriesOnTransientErrors: 3,
        multiSubnetFailover: false,
        packetSize: DEFAULT_PACKET_SIZE,
        port: DEFAULT_PORT,
        readOnlyIntent: false,
        requestTimeout: DEFAULT_CLIENT_REQUEST_TIMEOUT,
        rowCollectionOnDone: false,
        rowCollectionOnRequestCompletion: false,
        serverName: undefined,
        serverSupportsColumnEncryption: false,
        tdsVersion: DEFAULT_TDS_VERSION,
        textsize: DEFAULT_TEXTSIZE,
        trustedServerNameAE: undefined,
        trustServerCertificate: false,
        useColumnNames: false,
        useUTC: true,
        workstationId: undefined,
        lowerCaseGuids: false
      }
    };
    if (config.options) {
      if (config.options.port && config.options.instanceName) {
        throw new Error('Port and instanceName are mutually exclusive, but ' + config.options.port + ' and ' + config.options.instanceName + ' provided');
      }
      if (config.options.abortTransactionOnError !== undefined) {
        if (typeof config.options.abortTransactionOnError !== 'boolean' && config.options.abortTransactionOnError !== null) {
          throw new TypeError('The "config.options.abortTransactionOnError" property must be of type string or null.');
        }
        this.config.options.abortTransactionOnError = config.options.abortTransactionOnError;
      }
      if (config.options.appName !== undefined) {
        if (typeof config.options.appName !== 'string') {
          throw new TypeError('The "config.options.appName" property must be of type string.');
        }
        this.config.options.appName = config.options.appName;
      }
      if (config.options.camelCaseColumns !== undefined) {
        if (typeof config.options.camelCaseColumns !== 'boolean') {
          throw new TypeError('The "config.options.camelCaseColumns" property must be of type boolean.');
        }
        this.config.options.camelCaseColumns = config.options.camelCaseColumns;
      }
      if (config.options.cancelTimeout !== undefined) {
        if (typeof config.options.cancelTimeout !== 'number') {
          throw new TypeError('The "config.options.cancelTimeout" property must be of type number.');
        }
        this.config.options.cancelTimeout = config.options.cancelTimeout;
      }
      if (config.options.columnNameReplacer) {
        if (typeof config.options.columnNameReplacer !== 'function') {
          throw new TypeError('The "config.options.cancelTimeout" property must be of type function.');
        }
        this.config.options.columnNameReplacer = config.options.columnNameReplacer;
      }
      if (config.options.connectionIsolationLevel !== undefined) {
        (0, _transaction.assertValidIsolationLevel)(config.options.connectionIsolationLevel, 'config.options.connectionIsolationLevel');
        this.config.options.connectionIsolationLevel = config.options.connectionIsolationLevel;
      }
      if (config.options.connectTimeout !== undefined) {
        if (typeof config.options.connectTimeout !== 'number') {
          throw new TypeError('The "config.options.connectTimeout" property must be of type number.');
        }
        this.config.options.connectTimeout = config.options.connectTimeout;
      }
      if (config.options.connector !== undefined) {
        if (typeof config.options.connector !== 'function') {
          throw new TypeError('The "config.options.connector" property must be a function.');
        }
        this.config.options.connector = config.options.connector;
      }
      if (config.options.cryptoCredentialsDetails !== undefined) {
        if (typeof config.options.cryptoCredentialsDetails !== 'object' || config.options.cryptoCredentialsDetails === null) {
          throw new TypeError('The "config.options.cryptoCredentialsDetails" property must be of type Object.');
        }
        this.config.options.cryptoCredentialsDetails = config.options.cryptoCredentialsDetails;
      }
      if (config.options.database !== undefined) {
        if (typeof config.options.database !== 'string') {
          throw new TypeError('The "config.options.database" property must be of type string.');
        }
        this.config.options.database = config.options.database;
      }
      if (config.options.datefirst !== undefined) {
        if (typeof config.options.datefirst !== 'number' && config.options.datefirst !== null) {
          throw new TypeError('The "config.options.datefirst" property must be of type number.');
        }
        if (config.options.datefirst !== null && (config.options.datefirst < 1 || config.options.datefirst > 7)) {
          throw new RangeError('The "config.options.datefirst" property must be >= 1 and <= 7');
        }
        this.config.options.datefirst = config.options.datefirst;
      }
      if (config.options.dateFormat !== undefined) {
        if (typeof config.options.dateFormat !== 'string' && config.options.dateFormat !== null) {
          throw new TypeError('The "config.options.dateFormat" property must be of type string or null.');
        }
        this.config.options.dateFormat = config.options.dateFormat;
      }
      if (config.options.debug) {
        if (config.options.debug.data !== undefined) {
          if (typeof config.options.debug.data !== 'boolean') {
            throw new TypeError('The "config.options.debug.data" property must be of type boolean.');
          }
          this.config.options.debug.data = config.options.debug.data;
        }
        if (config.options.debug.packet !== undefined) {
          if (typeof config.options.debug.packet !== 'boolean') {
            throw new TypeError('The "config.options.debug.packet" property must be of type boolean.');
          }
          this.config.options.debug.packet = config.options.debug.packet;
        }
        if (config.options.debug.payload !== undefined) {
          if (typeof config.options.debug.payload !== 'boolean') {
            throw new TypeError('The "config.options.debug.payload" property must be of type boolean.');
          }
          this.config.options.debug.payload = config.options.debug.payload;
        }
        if (config.options.debug.token !== undefined) {
          if (typeof config.options.debug.token !== 'boolean') {
            throw new TypeError('The "config.options.debug.token" property must be of type boolean.');
          }
          this.config.options.debug.token = config.options.debug.token;
        }
      }
      if (config.options.enableAnsiNull !== undefined) {
        if (typeof config.options.enableAnsiNull !== 'boolean' && config.options.enableAnsiNull !== null) {
          throw new TypeError('The "config.options.enableAnsiNull" property must be of type boolean or null.');
        }
        this.config.options.enableAnsiNull = config.options.enableAnsiNull;
      }
      if (config.options.enableAnsiNullDefault !== undefined) {
        if (typeof config.options.enableAnsiNullDefault !== 'boolean' && config.options.enableAnsiNullDefault !== null) {
          throw new TypeError('The "config.options.enableAnsiNullDefault" property must be of type boolean or null.');
        }
        this.config.options.enableAnsiNullDefault = config.options.enableAnsiNullDefault;
      }
      if (config.options.enableAnsiPadding !== undefined) {
        if (typeof config.options.enableAnsiPadding !== 'boolean' && config.options.enableAnsiPadding !== null) {
          throw new TypeError('The "config.options.enableAnsiPadding" property must be of type boolean or null.');
        }
        this.config.options.enableAnsiPadding = config.options.enableAnsiPadding;
      }
      if (config.options.enableAnsiWarnings !== undefined) {
        if (typeof config.options.enableAnsiWarnings !== 'boolean' && config.options.enableAnsiWarnings !== null) {
          throw new TypeError('The "config.options.enableAnsiWarnings" property must be of type boolean or null.');
        }
        this.config.options.enableAnsiWarnings = config.options.enableAnsiWarnings;
      }
      if (config.options.enableArithAbort !== undefined) {
        if (typeof config.options.enableArithAbort !== 'boolean' && config.options.enableArithAbort !== null) {
          throw new TypeError('The "config.options.enableArithAbort" property must be of type boolean or null.');
        }
        this.config.options.enableArithAbort = config.options.enableArithAbort;
      }
      if (config.options.enableConcatNullYieldsNull !== undefined) {
        if (typeof config.options.enableConcatNullYieldsNull !== 'boolean' && config.options.enableConcatNullYieldsNull !== null) {
          throw new TypeError('The "config.options.enableConcatNullYieldsNull" property must be of type boolean or null.');
        }
        this.config.options.enableConcatNullYieldsNull = config.options.enableConcatNullYieldsNull;
      }
      if (config.options.enableCursorCloseOnCommit !== undefined) {
        if (typeof config.options.enableCursorCloseOnCommit !== 'boolean' && config.options.enableCursorCloseOnCommit !== null) {
          throw new TypeError('The "config.options.enableCursorCloseOnCommit" property must be of type boolean or null.');
        }
        this.config.options.enableCursorCloseOnCommit = config.options.enableCursorCloseOnCommit;
      }
      if (config.options.enableImplicitTransactions !== undefined) {
        if (typeof config.options.enableImplicitTransactions !== 'boolean' && config.options.enableImplicitTransactions !== null) {
          throw new TypeError('The "config.options.enableImplicitTransactions" property must be of type boolean or null.');
        }
        this.config.options.enableImplicitTransactions = config.options.enableImplicitTransactions;
      }
      if (config.options.enableNumericRoundabort !== undefined) {
        if (typeof config.options.enableNumericRoundabort !== 'boolean' && config.options.enableNumericRoundabort !== null) {
          throw new TypeError('The "config.options.enableNumericRoundabort" property must be of type boolean or null.');
        }
        this.config.options.enableNumericRoundabort = config.options.enableNumericRoundabort;
      }
      if (config.options.enableQuotedIdentifier !== undefined) {
        if (typeof config.options.enableQuotedIdentifier !== 'boolean' && config.options.enableQuotedIdentifier !== null) {
          throw new TypeError('The "config.options.enableQuotedIdentifier" property must be of type boolean or null.');
        }
        this.config.options.enableQuotedIdentifier = config.options.enableQuotedIdentifier;
      }
      if (config.options.encrypt !== undefined) {
        if (typeof config.options.encrypt !== 'boolean') {
          if (config.options.encrypt !== 'strict') {
            throw new TypeError('The "encrypt" property must be set to "strict", or of type boolean.');
          }
        }
        this.config.options.encrypt = config.options.encrypt;
      }
      if (config.options.fallbackToDefaultDb !== undefined) {
        if (typeof config.options.fallbackToDefaultDb !== 'boolean') {
          throw new TypeError('The "config.options.fallbackToDefaultDb" property must be of type boolean.');
        }
        this.config.options.fallbackToDefaultDb = config.options.fallbackToDefaultDb;
      }
      if (config.options.instanceName !== undefined) {
        if (typeof config.options.instanceName !== 'string') {
          throw new TypeError('The "config.options.instanceName" property must be of type string.');
        }
        this.config.options.instanceName = config.options.instanceName;
        this.config.options.port = undefined;
      }
      if (config.options.isolationLevel !== undefined) {
        (0, _transaction.assertValidIsolationLevel)(config.options.isolationLevel, 'config.options.isolationLevel');
        this.config.options.isolationLevel = config.options.isolationLevel;
      }
      if (config.options.language !== undefined) {
        if (typeof config.options.language !== 'string' && config.options.language !== null) {
          throw new TypeError('The "config.options.language" property must be of type string or null.');
        }
        this.config.options.language = config.options.language;
      }
      if (config.options.localAddress !== undefined) {
        if (typeof config.options.localAddress !== 'string') {
          throw new TypeError('The "config.options.localAddress" property must be of type string.');
        }
        this.config.options.localAddress = config.options.localAddress;
      }
      if (config.options.multiSubnetFailover !== undefined) {
        if (typeof config.options.multiSubnetFailover !== 'boolean') {
          throw new TypeError('The "config.options.multiSubnetFailover" property must be of type boolean.');
        }
        this.config.options.multiSubnetFailover = config.options.multiSubnetFailover;
      }
      if (config.options.packetSize !== undefined) {
        if (typeof config.options.packetSize !== 'number') {
          throw new TypeError('The "config.options.packetSize" property must be of type number.');
        }
        this.config.options.packetSize = config.options.packetSize;
      }
      if (config.options.port !== undefined) {
        if (typeof config.options.port !== 'number') {
          throw new TypeError('The "config.options.port" property must be of type number.');
        }
        if (config.options.port <= 0 || config.options.port >= 65536) {
          throw new RangeError('The "config.options.port" property must be > 0 and < 65536');
        }
        this.config.options.port = config.options.port;
        this.config.options.instanceName = undefined;
      }
      if (config.options.readOnlyIntent !== undefined) {
        if (typeof config.options.readOnlyIntent !== 'boolean') {
          throw new TypeError('The "config.options.readOnlyIntent" property must be of type boolean.');
        }
        this.config.options.readOnlyIntent = config.options.readOnlyIntent;
      }
      if (config.options.requestTimeout !== undefined) {
        if (typeof config.options.requestTimeout !== 'number') {
          throw new TypeError('The "config.options.requestTimeout" property must be of type number.');
        }
        this.config.options.requestTimeout = config.options.requestTimeout;
      }
      if (config.options.maxRetriesOnTransientErrors !== undefined) {
        if (typeof config.options.maxRetriesOnTransientErrors !== 'number') {
          throw new TypeError('The "config.options.maxRetriesOnTransientErrors" property must be of type number.');
        }
        if (config.options.maxRetriesOnTransientErrors < 0) {
          throw new TypeError('The "config.options.maxRetriesOnTransientErrors" property must be equal or greater than 0.');
        }
        this.config.options.maxRetriesOnTransientErrors = config.options.maxRetriesOnTransientErrors;
      }
      if (config.options.connectionRetryInterval !== undefined) {
        if (typeof config.options.connectionRetryInterval !== 'number') {
          throw new TypeError('The "config.options.connectionRetryInterval" property must be of type number.');
        }
        if (config.options.connectionRetryInterval <= 0) {
          throw new TypeError('The "config.options.connectionRetryInterval" property must be greater than 0.');
        }
        this.config.options.connectionRetryInterval = config.options.connectionRetryInterval;
      }
      if (config.options.rowCollectionOnDone !== undefined) {
        if (typeof config.options.rowCollectionOnDone !== 'boolean') {
          throw new TypeError('The "config.options.rowCollectionOnDone" property must be of type boolean.');
        }
        this.config.options.rowCollectionOnDone = config.options.rowCollectionOnDone;
      }
      if (config.options.rowCollectionOnRequestCompletion !== undefined) {
        if (typeof config.options.rowCollectionOnRequestCompletion !== 'boolean') {
          throw new TypeError('The "config.options.rowCollectionOnRequestCompletion" property must be of type boolean.');
        }
        this.config.options.rowCollectionOnRequestCompletion = config.options.rowCollectionOnRequestCompletion;
      }
      if (config.options.tdsVersion !== undefined) {
        if (typeof config.options.tdsVersion !== 'string') {
          throw new TypeError('The "config.options.tdsVersion" property must be of type string.');
        }
        this.config.options.tdsVersion = config.options.tdsVersion;
      }
      if (config.options.textsize !== undefined) {
        if (typeof config.options.textsize !== 'number' && config.options.textsize !== null) {
          throw new TypeError('The "config.options.textsize" property must be of type number or null.');
        }
        if (config.options.textsize > 2147483647) {
          throw new TypeError('The "config.options.textsize" can\'t be greater than 2147483647.');
        } else if (config.options.textsize < -1) {
          throw new TypeError('The "config.options.textsize" can\'t be smaller than -1.');
        }
        this.config.options.textsize = config.options.textsize | 0;
      }
      if (config.options.trustServerCertificate !== undefined) {
        if (typeof config.options.trustServerCertificate !== 'boolean') {
          throw new TypeError('The "config.options.trustServerCertificate" property must be of type boolean.');
        }
        this.config.options.trustServerCertificate = config.options.trustServerCertificate;
      }
      if (config.options.serverName !== undefined) {
        if (typeof config.options.serverName !== 'string') {
          throw new TypeError('The "config.options.serverName" property must be of type string.');
        }
        this.config.options.serverName = config.options.serverName;
      }
      if (config.options.useColumnNames !== undefined) {
        if (typeof config.options.useColumnNames !== 'boolean') {
          throw new TypeError('The "config.options.useColumnNames" property must be of type boolean.');
        }
        this.config.options.useColumnNames = config.options.useColumnNames;
      }
      if (config.options.useUTC !== undefined) {
        if (typeof config.options.useUTC !== 'boolean') {
          throw new TypeError('The "config.options.useUTC" property must be of type boolean.');
        }
        this.config.options.useUTC = config.options.useUTC;
      }
      if (config.options.workstationId !== undefined) {
        if (typeof config.options.workstationId !== 'string') {
          throw new TypeError('The "config.options.workstationId" property must be of type string.');
        }
        this.config.options.workstationId = config.options.workstationId;
      }
      if (config.options.lowerCaseGuids !== undefined) {
        if (typeof config.options.lowerCaseGuids !== 'boolean') {
          throw new TypeError('The "config.options.lowerCaseGuids" property must be of type boolean.');
        }
        this.config.options.lowerCaseGuids = config.options.lowerCaseGuids;
      }
    }
    this.secureContextOptions = this.config.options.cryptoCredentialsDetails;
    if (this.secureContextOptions.secureOptions === undefined) {
      // If the caller has not specified their own `secureOptions`,
      // we set `SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS` here.
      // Older SQL Server instances running on older Windows versions have
      // trouble with the BEAST workaround in OpenSSL.
      // As BEAST is a browser specific exploit, we can just disable this option here.
      this.secureContextOptions = Object.create(this.secureContextOptions, {
        secureOptions: {
          value: _constants.default.SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS
        }
      });
    }
    this.debug = this.createDebug();
    this.inTransaction = false;
    this.transactionDescriptors = [Buffer.from([0, 0, 0, 0, 0, 0, 0, 0])];

    // 'beginTransaction', 'commitTransaction' and 'rollbackTransaction'
    // events are utilized to maintain inTransaction property state which in
    // turn is used in managing transactions. These events are only fired for
    // TDS version 7.2 and beyond. The properties below are used to emulate
    // equivalent behavior for TDS versions before 7.2.
    this.transactionDepth = 0;
    this.isSqlBatch = false;
    this.closed = false;
    this.messageBuffer = Buffer.alloc(0);
    this.curTransientRetryCount = 0;
    this.transientErrorLookup = new _transientErrorLookup.TransientErrorLookup();
    this.state = this.STATE.INITIALIZED;
    this._cancelAfterRequestSent = () => {
      this.messageIo.sendMessage(_packet.TYPE.ATTENTION);
      this.createCancelTimer();
    };
  }
  connect(connectListener) {
    if (this.state !== this.STATE.INITIALIZED) {
      throw new _errors.ConnectionError('`.connect` can not be called on a Connection in `' + this.state.name + '` state.');
    }
    if (connectListener) {
      const onConnect = err => {
        this.removeListener('error', onError);
        connectListener(err);
      };
      const onError = err => {
        this.removeListener('connect', onConnect);
        connectListener(err);
      };
      this.once('connect', onConnect);
      this.once('error', onError);
    }
    this.transitionTo(this.STATE.CONNECTING);
  }

  /**
   * The server has reported that the charset has changed.
   */

  /**
   * The attempt to connect and validate has completed.
   */

  /**
   * The server has reported that the active database has changed.
   * This may be as a result of a successful login, or a `use` statement.
   */

  /**
   * A debug message is available. It may be logged or ignored.
   */

  /**
   * Internal error occurs.
   */

  /**
   * The server has issued an error message.
   */

  /**
   * The connection has ended.
   *
   * This may be as a result of the client calling [[close]], the server
   * closing the connection, or a network error.
   */

  /**
   * The server has issued an information message.
   */

  /**
   * The server has reported that the language has changed.
   */

  /**
   * The connection was reset.
   */

  /**
   * A secure connection has been established.
   */

  on(event, listener) {
    return super.on(event, listener);
  }

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  /**
   * @private
   */

  emit(event, ...args) {
    return super.emit(event, ...args);
  }

  /**
   * Closes the connection to the database.
   *
   * The [[Event_end]] will be emitted once the connection has been closed.
   */
  close() {
    this.transitionTo(this.STATE.FINAL);
  }

  /**
   * @private
   */
  initialiseConnection() {
    const signal = this.createConnectTimer();
    if (this.config.options.port) {
      return this.connectOnPort(this.config.options.port, this.config.options.multiSubnetFailover, signal, this.config.options.connector);
    } else {
      return (0, _instanceLookup.instanceLookup)({
        server: this.config.server,
        instanceName: this.config.options.instanceName,
        timeout: this.config.options.connectTimeout,
        signal: signal
      }).then(port => {
        process.nextTick(() => {
          this.connectOnPort(port, this.config.options.multiSubnetFailover, signal, this.config.options.connector);
        });
      }, err => {
        this.clearConnectTimer();
        if (signal.aborted) {
          // Ignore the AbortError for now, this is still handled by the connectTimer firing
          return;
        }
        process.nextTick(() => {
          this.emit('connect', new _errors.ConnectionError(err.message, 'EINSTLOOKUP'));
        });
      });
    }
  }

  /**
   * @private
   */
  cleanupConnection(cleanupType) {
    if (!this.closed) {
      this.clearConnectTimer();
      this.clearRequestTimer();
      this.clearRetryTimer();
      this.closeConnection();
      if (cleanupType === CLEANUP_TYPE.REDIRECT) {
        this.emit('rerouting');
      } else if (cleanupType !== CLEANUP_TYPE.RETRY) {
        process.nextTick(() => {
          this.emit('end');
        });
      }
      const request = this.request;
      if (request) {
        const err = new _errors.RequestError('Connection closed before request completed.', 'ECLOSE');
        request.callback(err);
        this.request = undefined;
      }
      this.closed = true;
      this.loginError = undefined;
    }
  }

  /**
   * @private
   */
  createDebug() {
    const debug = new _debug.default(this.config.options.debug);
    debug.on('debug', message => {
      this.emit('debug', message);
    });
    return debug;
  }

  /**
   * @private
   */
  createTokenStreamParser(message, handler) {
    return new _tokenStreamParser.Parser(message, this.debug, handler, this.config.options);
  }
  socketHandlingForSendPreLogin(socket) {
    socket.on('error', error => {
      this.socketError(error);
    });
    socket.on('close', () => {
      this.socketClose();
    });
    socket.on('end', () => {
      this.socketEnd();
    });
    socket.setKeepAlive(true, KEEP_ALIVE_INITIAL_DELAY);
    this.messageIo = new _messageIo.default(socket, this.config.options.packetSize, this.debug);
    this.messageIo.on('secure', cleartext => {
      this.emit('secure', cleartext);
    });
    this.socket = socket;
    this.closed = false;
    this.debug.log('connected to ' + this.config.server + ':' + this.config.options.port);
    this.sendPreLogin();
    this.transitionTo(this.STATE.SENT_PRELOGIN);
  }
  wrapWithTls(socket, signal) {
    signal.throwIfAborted();
    return new Promise((resolve, reject) => {
      const secureContext = tls.createSecureContext(this.secureContextOptions);
      // If connect to an ip address directly,
      // need to set the servername to an empty string
      // if the user has not given a servername explicitly
      const serverName = !net.isIP(this.config.server) ? this.config.server : '';
      const encryptOptions = {
        host: this.config.server,
        socket: socket,
        ALPNProtocols: ['tds/8.0'],
        secureContext: secureContext,
        servername: this.config.options.serverName ? this.config.options.serverName : serverName
      };
      const encryptsocket = tls.connect(encryptOptions);
      const onAbort = () => {
        encryptsocket.removeListener('error', onError);
        encryptsocket.removeListener('connect', onConnect);
        encryptsocket.destroy();
        reject(signal.reason);
      };
      const onError = err => {
        signal.removeEventListener('abort', onAbort);
        encryptsocket.removeListener('error', onError);
        encryptsocket.removeListener('connect', onConnect);
        encryptsocket.destroy();
        reject(err);
      };
      const onConnect = () => {
        signal.removeEventListener('abort', onAbort);
        encryptsocket.removeListener('error', onError);
        encryptsocket.removeListener('connect', onConnect);
        resolve(encryptsocket);
      };
      signal.addEventListener('abort', onAbort, {
        once: true
      });
      encryptsocket.on('error', onError);
      encryptsocket.on('secureConnect', onConnect);
    });
  }
  connectOnPort(port, multiSubnetFailover, signal, customConnector) {
    const connectOpts = {
      host: this.routingData ? this.routingData.server : this.config.server,
      port: this.routingData ? this.routingData.port : port,
      localAddress: this.config.options.localAddress
    };
    const connect = customConnector || (multiSubnetFailover ? _connector.connectInParallel : _connector.connectInSequence);
    (async () => {
      let socket = await connect(connectOpts, _dns.default.lookup, signal);
      if (this.config.options.encrypt === 'strict') {
        try {
          // Wrap the socket with TLS for TDS 8.0
          socket = await this.wrapWithTls(socket, signal);
        } catch (err) {
          socket.end();
          throw err;
        }
      }
      this.socketHandlingForSendPreLogin(socket);
    })().catch(err => {
      this.clearConnectTimer();
      if (signal.aborted) {
        return;
      }
      process.nextTick(() => {
        this.socketError(err);
      });
    });
  }

  /**
   * @private
   */
  closeConnection() {
    if (this.socket) {
      this.socket.destroy();
    }
  }

  /**
   * @private
   */
  createConnectTimer() {
    const controller = new _nodeAbortController.AbortController();
    this.connectTimer = setTimeout(() => {
      controller.abort();
      this.connectTimeout();
    }, this.config.options.connectTimeout);
    return controller.signal;
  }

  /**
   * @private
   */
  createCancelTimer() {
    this.clearCancelTimer();
    const timeout = this.config.options.cancelTimeout;
    if (timeout > 0) {
      this.cancelTimer = setTimeout(() => {
        this.cancelTimeout();
      }, timeout);
    }
  }

  /**
   * @private
   */
  createRequestTimer() {
    this.clearRequestTimer(); // release old timer, just to be safe
    const request = this.request;
    const timeout = request.timeout !== undefined ? request.timeout : this.config.options.requestTimeout;
    if (timeout) {
      this.requestTimer = setTimeout(() => {
        this.requestTimeout();
      }, timeout);
    }
  }

  /**
   * @private
   */
  createRetryTimer() {
    this.clearRetryTimer();
    this.retryTimer = setTimeout(() => {
      this.retryTimeout();
    }, this.config.options.connectionRetryInterval);
  }

  /**
   * @private
   */
  connectTimeout() {
    const hostPostfix = this.config.options.port ? `:${this.config.options.port}` : `\\${this.config.options.instanceName}`;
    // If we have routing data stored, this connection has been redirected
    const server = this.routingData ? this.routingData.server : this.config.server;
    const port = this.routingData ? `:${this.routingData.port}` : hostPostfix;
    // Grab the target host from the connection configuration, and from a redirect message
    // otherwise, leave the message empty.
    const routingMessage = this.routingData ? ` (redirected from ${this.config.server}${hostPostfix})` : '';
    const message = `Failed to connect to ${server}${port}${routingMessage} in ${this.config.options.connectTimeout}ms`;
    this.debug.log(message);
    this.emit('connect', new _errors.ConnectionError(message, 'ETIMEOUT'));
    this.connectTimer = undefined;
    this.dispatchEvent('connectTimeout');
  }

  /**
   * @private
   */
  cancelTimeout() {
    const message = `Failed to cancel request in ${this.config.options.cancelTimeout}ms`;
    this.debug.log(message);
    this.dispatchEvent('socketError', new _errors.ConnectionError(message, 'ETIMEOUT'));
  }

  /**
   * @private
   */
  requestTimeout() {
    this.requestTimer = undefined;
    const request = this.request;
    request.cancel();
    const timeout = request.timeout !== undefined ? request.timeout : this.config.options.requestTimeout;
    const message = 'Timeout: Request failed to complete in ' + timeout + 'ms';
    request.error = new _errors.RequestError(message, 'ETIMEOUT');
  }

  /**
   * @private
   */
  retryTimeout() {
    this.retryTimer = undefined;
    this.emit('retry');
    this.transitionTo(this.STATE.CONNECTING);
  }

  /**
   * @private
   */
  clearConnectTimer() {
    if (this.connectTimer) {
      clearTimeout(this.connectTimer);
      this.connectTimer = undefined;
    }
  }

  /**
   * @private
   */
  clearCancelTimer() {
    if (this.cancelTimer) {
      clearTimeout(this.cancelTimer);
      this.cancelTimer = undefined;
    }
  }

  /**
   * @private
   */
  clearRequestTimer() {
    if (this.requestTimer) {
      clearTimeout(this.requestTimer);
      this.requestTimer = undefined;
    }
  }

  /**
   * @private
   */
  clearRetryTimer() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = undefined;
    }
  }

  /**
   * @private
   */
  transitionTo(newState) {
    if (this.state === newState) {
      this.debug.log('State is already ' + newState.name);
      return;
    }
    if (this.state && this.state.exit) {
      this.state.exit.call(this, newState);
    }
    this.debug.log('State change: ' + (this.state ? this.state.name : 'undefined') + ' -> ' + newState.name);
    this.state = newState;
    if (this.state.enter) {
      this.state.enter.apply(this);
    }
  }

  /**
   * @private
   */
  getEventHandler(eventName) {
    const handler = this.state.events[eventName];
    if (!handler) {
      throw new Error(`No event '${eventName}' in state '${this.state.name}'`);
    }
    return handler;
  }

  /**
   * @private
   */
  dispatchEvent(eventName, ...args) {
    const handler = this.state.events[eventName];
    if (handler) {
      handler.apply(this, args);
    } else {
      this.emit('error', new Error(`No event '${eventName}' in state '${this.state.name}'`));
      this.close();
    }
  }

  /**
   * @private
   */
  socketError(error) {
    if (this.state === this.STATE.CONNECTING || this.state === this.STATE.SENT_TLSSSLNEGOTIATION) {
      const hostPostfix = this.config.options.port ? `:${this.config.options.port}` : `\\${this.config.options.instanceName}`;
      // If we have routing data stored, this connection has been redirected
      const server = this.routingData ? this.routingData.server : this.config.server;
      const port = this.routingData ? `:${this.routingData.port}` : hostPostfix;
      // Grab the target host from the connection configuration, and from a redirect message
      // otherwise, leave the message empty.
      const routingMessage = this.routingData ? ` (redirected from ${this.config.server}${hostPostfix})` : '';
      const message = `Failed to connect to ${server}${port}${routingMessage} - ${error.message}`;
      this.debug.log(message);
      this.emit('connect', new _errors.ConnectionError(message, 'ESOCKET'));
    } else {
      const message = `Connection lost - ${error.message}`;
      this.debug.log(message);
      this.emit('error', new _errors.ConnectionError(message, 'ESOCKET'));
    }
    this.dispatchEvent('socketError', error);
  }

  /**
   * @private
   */
  socketEnd() {
    this.debug.log('socket ended');
    if (this.state !== this.STATE.FINAL) {
      const error = new Error('socket hang up');
      error.code = 'ECONNRESET';
      this.socketError(error);
    }
  }

  /**
   * @private
   */
  socketClose() {
    this.debug.log('connection to ' + this.config.server + ':' + this.config.options.port + ' closed');
    if (this.state === this.STATE.REROUTING) {
      this.debug.log('Rerouting to ' + this.routingData.server + ':' + this.routingData.port);
      this.dispatchEvent('reconnect');
    } else if (this.state === this.STATE.TRANSIENT_FAILURE_RETRY) {
      const server = this.routingData ? this.routingData.server : this.config.server;
      const port = this.routingData ? this.routingData.port : this.config.options.port;
      this.debug.log('Retry after transient failure connecting to ' + server + ':' + port);
      this.dispatchEvent('retry');
    } else {
      this.transitionTo(this.STATE.FINAL);
    }
  }

  /**
   * @private
   */
  sendPreLogin() {
    const [, major, minor, build] = /^(\d+)\.(\d+)\.(\d+)/.exec(_package.version) ?? ['0.0.0', '0', '0', '0'];
    const payload = new _preloginPayload.default({
      // If encrypt setting is set to 'strict', then we should have already done the encryption before calling
      // this function. Therefore, the encrypt will be set to false here.
      // Otherwise, we will set encrypt here based on the encrypt Boolean value from the configuration.
      encrypt: typeof this.config.options.encrypt === 'boolean' && this.config.options.encrypt,
      version: {
        major: Number(major),
        minor: Number(minor),
        build: Number(build),
        subbuild: 0
      }
    });
    this.messageIo.sendMessage(_packet.TYPE.PRELOGIN, payload.data);
    this.debug.payload(function () {
      return payload.toString('  ');
    });
  }

  /**
   * @private
   */
  sendLogin7Packet() {
    const payload = new _login7Payload.default({
      tdsVersion: _tdsVersions.versions[this.config.options.tdsVersion],
      packetSize: this.config.options.packetSize,
      clientProgVer: 0,
      clientPid: process.pid,
      connectionId: 0,
      clientTimeZone: new Date().getTimezoneOffset(),
      clientLcid: 0x00000409
    });
    const {
      authentication
    } = this.config;
    switch (authentication.type) {
      case 'azure-active-directory-password':
        payload.fedAuth = {
          type: 'ADAL',
          echo: this.fedAuthRequired,
          workflow: 'default'
        };
        break;
      case 'azure-active-directory-access-token':
        payload.fedAuth = {
          type: 'SECURITYTOKEN',
          echo: this.fedAuthRequired,
          fedAuthToken: authentication.options.token
        };
        break;
      case 'azure-active-directory-msi-vm':
      case 'azure-active-directory-default':
      case 'azure-active-directory-msi-app-service':
      case 'azure-active-directory-service-principal-secret':
        payload.fedAuth = {
          type: 'ADAL',
          echo: this.fedAuthRequired,
          workflow: 'integrated'
        };
        break;
      case 'ntlm':
        payload.sspi = (0, _ntlm.createNTLMRequest)({
          domain: authentication.options.domain
        });
        break;
      default:
        payload.userName = authentication.options.userName;
        payload.password = authentication.options.password;
    }
    payload.hostname = this.config.options.workstationId || _os.default.hostname();
    payload.serverName = this.routingData ? this.routingData.server : this.config.server;
    payload.appName = this.config.options.appName || 'Tedious';
    payload.libraryName = _library.name;
    payload.language = this.config.options.language;
    payload.database = this.config.options.database;
    payload.clientId = Buffer.from([1, 2, 3, 4, 5, 6]);
    payload.readOnlyIntent = this.config.options.readOnlyIntent;
    payload.initDbFatal = !this.config.options.fallbackToDefaultDb;
    this.routingData = undefined;
    this.messageIo.sendMessage(_packet.TYPE.LOGIN7, payload.toBuffer());
    this.debug.payload(function () {
      return payload.toString('  ');
    });
  }

  /**
   * @private
   */
  sendFedAuthTokenMessage(token) {
    const accessTokenLen = Buffer.byteLength(token, 'ucs2');
    const data = Buffer.alloc(8 + accessTokenLen);
    let offset = 0;
    offset = data.writeUInt32LE(accessTokenLen + 4, offset);
    offset = data.writeUInt32LE(accessTokenLen, offset);
    data.write(token, offset, 'ucs2');
    this.messageIo.sendMessage(_packet.TYPE.FEDAUTH_TOKEN, data);
    // sent the fedAuth token message, the rest is similar to standard login 7
    this.transitionTo(this.STATE.SENT_LOGIN7_WITH_STANDARD_LOGIN);
  }

  /**
   * @private
   */
  sendInitialSql() {
    const payload = new _sqlbatchPayload.default(this.getInitialSql(), this.currentTransactionDescriptor(), this.config.options);
    const message = new _message.default({
      type: _packet.TYPE.SQL_BATCH
    });
    this.messageIo.outgoingMessageStream.write(message);
    _stream.Readable.from(payload).pipe(message);
  }

  /**
   * @private
   */
  getInitialSql() {
    const options = [];
    if (this.config.options.enableAnsiNull === true) {
      options.push('set ansi_nulls on');
    } else if (this.config.options.enableAnsiNull === false) {
      options.push('set ansi_nulls off');
    }
    if (this.config.options.enableAnsiNullDefault === true) {
      options.push('set ansi_null_dflt_on on');
    } else if (this.config.options.enableAnsiNullDefault === false) {
      options.push('set ansi_null_dflt_on off');
    }
    if (this.config.options.enableAnsiPadding === true) {
      options.push('set ansi_padding on');
    } else if (this.config.options.enableAnsiPadding === false) {
      options.push('set ansi_padding off');
    }
    if (this.config.options.enableAnsiWarnings === true) {
      options.push('set ansi_warnings on');
    } else if (this.config.options.enableAnsiWarnings === false) {
      options.push('set ansi_warnings off');
    }
    if (this.config.options.enableArithAbort === true) {
      options.push('set arithabort on');
    } else if (this.config.options.enableArithAbort === false) {
      options.push('set arithabort off');
    }
    if (this.config.options.enableConcatNullYieldsNull === true) {
      options.push('set concat_null_yields_null on');
    } else if (this.config.options.enableConcatNullYieldsNull === false) {
      options.push('set concat_null_yields_null off');
    }
    if (this.config.options.enableCursorCloseOnCommit === true) {
      options.push('set cursor_close_on_commit on');
    } else if (this.config.options.enableCursorCloseOnCommit === false) {
      options.push('set cursor_close_on_commit off');
    }
    if (this.config.options.datefirst !== null) {
      options.push(`set datefirst ${this.config.options.datefirst}`);
    }
    if (this.config.options.dateFormat !== null) {
      options.push(`set dateformat ${this.config.options.dateFormat}`);
    }
    if (this.config.options.enableImplicitTransactions === true) {
      options.push('set implicit_transactions on');
    } else if (this.config.options.enableImplicitTransactions === false) {
      options.push('set implicit_transactions off');
    }
    if (this.config.options.language !== null) {
      options.push(`set language ${this.config.options.language}`);
    }
    if (this.config.options.enableNumericRoundabort === true) {
      options.push('set numeric_roundabort on');
    } else if (this.config.options.enableNumericRoundabort === false) {
      options.push('set numeric_roundabort off');
    }
    if (this.config.options.enableQuotedIdentifier === true) {
      options.push('set quoted_identifier on');
    } else if (this.config.options.enableQuotedIdentifier === false) {
      options.push('set quoted_identifier off');
    }
    if (this.config.options.textsize !== null) {
      options.push(`set textsize ${this.config.options.textsize}`);
    }
    if (this.config.options.connectionIsolationLevel !== null) {
      options.push(`set transaction isolation level ${this.getIsolationLevelText(this.config.options.connectionIsolationLevel)}`);
    }
    if (this.config.options.abortTransactionOnError === true) {
      options.push('set xact_abort on');
    } else if (this.config.options.abortTransactionOnError === false) {
      options.push('set xact_abort off');
    }
    return options.join('\n');
  }

  /**
   * @private
   */
  processedInitialSql() {
    this.clearConnectTimer();
    this.emit('connect');
  }

  /**
   * Execute the SQL batch represented by [[Request]].
   * There is no param support, and unlike [[Request.execSql]],
   * it is not likely that SQL Server will reuse the execution plan it generates for the SQL.
   *
   * In almost all cases, [[Request.execSql]] will be a better choice.
   *
   * @param request A [[Request]] object representing the request.
   */
  execSqlBatch(request) {
    this.makeRequest(request, _packet.TYPE.SQL_BATCH, new _sqlbatchPayload.default(request.sqlTextOrProcedure, this.currentTransactionDescriptor(), this.config.options));
  }

  /**
   *  Execute the SQL represented by [[Request]].
   *
   * As `sp_executesql` is used to execute the SQL, if the same SQL is executed multiples times
   * using this function, the SQL Server query optimizer is likely to reuse the execution plan it generates
   * for the first execution. This may also result in SQL server treating the request like a stored procedure
   * which can result in the [[Event_doneInProc]] or [[Event_doneProc]] events being emitted instead of the
   * [[Event_done]] event you might expect. Using [[execSqlBatch]] will prevent this from occurring but may have a negative performance impact.
   *
   * Beware of the way that scoping rules apply, and how they may [affect local temp tables](http://weblogs.sqlteam.com/mladenp/archive/2006/11/03/17197.aspx)
   * If you're running in to scoping issues, then [[execSqlBatch]] may be a better choice.
   * See also [issue #24](https://github.com/pekim/tedious/issues/24)
   *
   * @param request A [[Request]] object representing the request.
   */
  execSql(request) {
    try {
      request.validateParameters(this.databaseCollation);
    } catch (error) {
      request.error = error;
      process.nextTick(() => {
        this.debug.log(error.message);
        request.callback(error);
      });
      return;
    }
    const parameters = [];
    parameters.push({
      type: _dataType.TYPES.NVarChar,
      name: 'statement',
      value: request.sqlTextOrProcedure,
      output: false,
      length: undefined,
      precision: undefined,
      scale: undefined
    });
    if (request.parameters.length) {
      parameters.push({
        type: _dataType.TYPES.NVarChar,
        name: 'params',
        value: request.makeParamsParameter(request.parameters),
        output: false,
        length: undefined,
        precision: undefined,
        scale: undefined
      });
      parameters.push(...request.parameters);
    }
    this.makeRequest(request, _packet.TYPE.RPC_REQUEST, new _rpcrequestPayload.default(_specialStoredProcedure.default.Sp_ExecuteSql, parameters, this.currentTransactionDescriptor(), this.config.options, this.databaseCollation));
  }

  /**
   * Creates a new BulkLoad instance.
   *
   * @param table The name of the table to bulk-insert into.
   * @param options A set of bulk load options.
   */

  newBulkLoad(table, callbackOrOptions, callback) {
    let options;
    if (callback === undefined) {
      callback = callbackOrOptions;
      options = {};
    } else {
      options = callbackOrOptions;
    }
    if (typeof options !== 'object') {
      throw new TypeError('"options" argument must be an object');
    }
    return new _bulkLoad.default(table, this.databaseCollation, this.config.options, options, callback);
  }

  /**
   * Execute a [[BulkLoad]].
   *
   * ```js
   * // We want to perform a bulk load into a table with the following format:
   * // CREATE TABLE employees (first_name nvarchar(255), last_name nvarchar(255), day_of_birth date);
   *
   * const bulkLoad = connection.newBulkLoad('employees', (err, rowCount) => {
   *   // ...
   * });
   *
   * // First, we need to specify the columns that we want to write to,
   * // and their definitions. These definitions must match the actual table,
   * // otherwise the bulk load will fail.
   * bulkLoad.addColumn('first_name', TYPES.NVarchar, { nullable: false });
   * bulkLoad.addColumn('last_name', TYPES.NVarchar, { nullable: false });
   * bulkLoad.addColumn('date_of_birth', TYPES.Date, { nullable: false });
   *
   * // Execute a bulk load with a predefined list of rows.
   * //
   * // Note that these rows are held in memory until the
   * // bulk load was performed, so if you need to write a large
   * // number of rows (e.g. by reading from a CSV file),
   * // passing an `AsyncIterable` is advisable to keep memory usage low.
   * connection.execBulkLoad(bulkLoad, [
   *   { 'first_name': 'Steve', 'last_name': 'Jobs', 'day_of_birth': new Date('02-24-1955') },
   *   { 'first_name': 'Bill', 'last_name': 'Gates', 'day_of_birth': new Date('10-28-1955') }
   * ]);
   * ```
   *
   * @param bulkLoad A previously created [[BulkLoad]].
   * @param rows A [[Iterable]] or [[AsyncIterable]] that contains the rows that should be bulk loaded.
   */

  execBulkLoad(bulkLoad, rows) {
    bulkLoad.executionStarted = true;
    if (rows) {
      if (bulkLoad.streamingMode) {
        throw new Error("Connection.execBulkLoad can't be called with a BulkLoad that was put in streaming mode.");
      }
      if (bulkLoad.firstRowWritten) {
        throw new Error("Connection.execBulkLoad can't be called with a BulkLoad that already has rows written to it.");
      }
      const rowStream = _stream.Readable.from(rows);

      // Destroy the packet transform if an error happens in the row stream,
      // e.g. if an error is thrown from within a generator or stream.
      rowStream.on('error', err => {
        bulkLoad.rowToPacketTransform.destroy(err);
      });

      // Destroy the row stream if an error happens in the packet transform,
      // e.g. if the bulk load is cancelled.
      bulkLoad.rowToPacketTransform.on('error', err => {
        rowStream.destroy(err);
      });
      rowStream.pipe(bulkLoad.rowToPacketTransform);
    } else if (!bulkLoad.streamingMode) {
      // If the bulkload was not put into streaming mode by the user,
      // we end the rowToPacketTransform here for them.
      //
      // If it was put into streaming mode, it's the user's responsibility
      // to end the stream.
      bulkLoad.rowToPacketTransform.end();
    }
    const onCancel = () => {
      request.cancel();
    };
    const payload = new _bulkLoadPayload.BulkLoadPayload(bulkLoad);
    const request = new _request.default(bulkLoad.getBulkInsertSql(), error => {
      bulkLoad.removeListener('cancel', onCancel);
      if (error) {
        if (error.code === 'UNKNOWN') {
          error.message += ' This is likely because the schema of the BulkLoad does not match the schema of the table you are attempting to insert into.';
        }
        bulkLoad.error = error;
        bulkLoad.callback(error);
        return;
      }
      this.makeRequest(bulkLoad, _packet.TYPE.BULK_LOAD, payload);
    });
    bulkLoad.once('cancel', onCancel);
    this.execSqlBatch(request);
  }

  /**
   * Prepare the SQL represented by the request.
   *
   * The request can then be used in subsequent calls to
   * [[execute]] and [[unprepare]]
   *
   * @param request A [[Request]] object representing the request.
   *   Parameters only require a name and type. Parameter values are ignored.
   */
  prepare(request) {
    const parameters = [];
    parameters.push({
      type: _dataType.TYPES.Int,
      name: 'handle',
      value: undefined,
      output: true,
      length: undefined,
      precision: undefined,
      scale: undefined
    });
    parameters.push({
      type: _dataType.TYPES.NVarChar,
      name: 'params',
      value: request.parameters.length ? request.makeParamsParameter(request.parameters) : null,
      output: false,
      length: undefined,
      precision: undefined,
      scale: undefined
    });
    parameters.push({
      type: _dataType.TYPES.NVarChar,
      name: 'stmt',
      value: request.sqlTextOrProcedure,
      output: false,
      length: undefined,
      precision: undefined,
      scale: undefined
    });
    request.preparing = true;

    // TODO: We need to clean up this event handler, otherwise this leaks memory
    request.on('returnValue', (name, value) => {
      if (name === 'handle') {
        request.handle = value;
      } else {
        request.error = new _errors.RequestError(`Tedious > Unexpected output parameter ${name} from sp_prepare`);
      }
    });
    this.makeRequest(request, _packet.TYPE.RPC_REQUEST, new _rpcrequestPayload.default(_specialStoredProcedure.default.Sp_Prepare, parameters, this.currentTransactionDescriptor(), this.config.options, this.databaseCollation));
  }

  /**
   * Release the SQL Server resources associated with a previously prepared request.
   *
   * @param request A [[Request]] object representing the request.
   *   Parameters only require a name and type.
   *   Parameter values are ignored.
   */
  unprepare(request) {
    const parameters = [];
    parameters.push({
      type: _dataType.TYPES.Int,
      name: 'handle',
      // TODO: Abort if `request.handle` is not set
      value: request.handle,
      output: false,
      length: undefined,
      precision: undefined,
      scale: undefined
    });
    this.makeRequest(request, _packet.TYPE.RPC_REQUEST, new _rpcrequestPayload.default(_specialStoredProcedure.default.Sp_Unprepare, parameters, this.currentTransactionDescriptor(), this.config.options, this.databaseCollation));
  }

  /**
   * Execute previously prepared SQL, using the supplied parameters.
   *
   * @param request A previously prepared [[Request]].
   * @param parameters  An object whose names correspond to the names of
   *   parameters that were added to the [[Request]] before it was prepared.
   *   The object's values are passed as the parameters' values when the
   *   request is executed.
   */
  execute(request, parameters) {
    const executeParameters = [];
    executeParameters.push({
      type: _dataType.TYPES.Int,
      name: '',
      // TODO: Abort if `request.handle` is not set
      value: request.handle,
      output: false,
      length: undefined,
      precision: undefined,
      scale: undefined
    });
    try {
      for (let i = 0, len = request.parameters.length; i < len; i++) {
        const parameter = request.parameters[i];
        executeParameters.push({
          ...parameter,
          value: parameter.type.validate(parameters ? parameters[parameter.name] : null, this.databaseCollation)
        });
      }
    } catch (error) {
      request.error = error;
      process.nextTick(() => {
        this.debug.log(error.message);
        request.callback(error);
      });
      return;
    }
    this.makeRequest(request, _packet.TYPE.RPC_REQUEST, new _rpcrequestPayload.default(_specialStoredProcedure.default.Sp_Execute, executeParameters, this.currentTransactionDescriptor(), this.config.options, this.databaseCollation));
  }

  /**
   * Call a stored procedure represented by [[Request]].
   *
   * @param request A [[Request]] object representing the request.
   */
  callProcedure(request) {
    try {
      request.validateParameters(this.databaseCollation);
    } catch (error) {
      request.error = error;
      process.nextTick(() => {
        this.debug.log(error.message);
        request.callback(error);
      });
      return;
    }
    this.makeRequest(request, _packet.TYPE.RPC_REQUEST, new _rpcrequestPayload.default(request.sqlTextOrProcedure, request.parameters, this.currentTransactionDescriptor(), this.config.options, this.databaseCollation));
  }

  /**
   * Start a transaction.
   *
   * @param callback
   * @param name A string representing a name to associate with the transaction.
   *   Optional, and defaults to an empty string. Required when `isolationLevel`
   *   is present.
   * @param isolationLevel The isolation level that the transaction is to be run with.
   *
   *   The isolation levels are available from `require('tedious').ISOLATION_LEVEL`.
   *   * `READ_UNCOMMITTED`
   *   * `READ_COMMITTED`
   *   * `REPEATABLE_READ`
   *   * `SERIALIZABLE`
   *   * `SNAPSHOT`
   *
   *   Optional, and defaults to the Connection's isolation level.
   */
  beginTransaction(callback, name = '', isolationLevel = this.config.options.isolationLevel) {
    (0, _transaction.assertValidIsolationLevel)(isolationLevel, 'isolationLevel');
    const transaction = new _transaction.Transaction(name, isolationLevel);
    if (this.config.options.tdsVersion < '7_2') {
      return this.execSqlBatch(new _request.default('SET TRANSACTION ISOLATION LEVEL ' + transaction.isolationLevelToTSQL() + ';BEGIN TRAN ' + transaction.name, err => {
        this.transactionDepth++;
        if (this.transactionDepth === 1) {
          this.inTransaction = true;
        }
        callback(err);
      }));
    }
    const request = new _request.default(undefined, err => {
      return callback(err, this.currentTransactionDescriptor());
    });
    return this.makeRequest(request, _packet.TYPE.TRANSACTION_MANAGER, transaction.beginPayload(this.currentTransactionDescriptor()));
  }

  /**
   * Commit a transaction.
   *
   * There should be an active transaction - that is, [[beginTransaction]]
   * should have been previously called.
   *
   * @param callback
   * @param name A string representing a name to associate with the transaction.
   *   Optional, and defaults to an empty string. Required when `isolationLevel`is present.
   */
  commitTransaction(callback, name = '') {
    const transaction = new _transaction.Transaction(name);
    if (this.config.options.tdsVersion < '7_2') {
      return this.execSqlBatch(new _request.default('COMMIT TRAN ' + transaction.name, err => {
        this.transactionDepth--;
        if (this.transactionDepth === 0) {
          this.inTransaction = false;
        }
        callback(err);
      }));
    }
    const request = new _request.default(undefined, callback);
    return this.makeRequest(request, _packet.TYPE.TRANSACTION_MANAGER, transaction.commitPayload(this.currentTransactionDescriptor()));
  }

  /**
   * Rollback a transaction.
   *
   * There should be an active transaction - that is, [[beginTransaction]]
   * should have been previously called.
   *
   * @param callback
   * @param name A string representing a name to associate with the transaction.
   *   Optional, and defaults to an empty string.
   *   Required when `isolationLevel` is present.
   */
  rollbackTransaction(callback, name = '') {
    const transaction = new _transaction.Transaction(name);
    if (this.config.options.tdsVersion < '7_2') {
      return this.execSqlBatch(new _request.default('ROLLBACK TRAN ' + transaction.name, err => {
        this.transactionDepth--;
        if (this.transactionDepth === 0) {
          this.inTransaction = false;
        }
        callback(err);
      }));
    }
    const request = new _request.default(undefined, callback);
    return this.makeRequest(request, _packet.TYPE.TRANSACTION_MANAGER, transaction.rollbackPayload(this.currentTransactionDescriptor()));
  }

  /**
   * Set a savepoint within a transaction.
   *
   * There should be an active transaction - that is, [[beginTransaction]]
   * should have been previously called.
   *
   * @param callback
   * @param name A string representing a name to associate with the transaction.\
   *   Optional, and defaults to an empty string.
   *   Required when `isolationLevel` is present.
   */
  saveTransaction(callback, name) {
    const transaction = new _transaction.Transaction(name);
    if (this.config.options.tdsVersion < '7_2') {
      return this.execSqlBatch(new _request.default('SAVE TRAN ' + transaction.name, err => {
        this.transactionDepth++;
        callback(err);
      }));
    }
    const request = new _request.default(undefined, callback);
    return this.makeRequest(request, _packet.TYPE.TRANSACTION_MANAGER, transaction.savePayload(this.currentTransactionDescriptor()));
  }

  /**
   * Run the given callback after starting a transaction, and commit or
   * rollback the transaction afterwards.
   *
   * This is a helper that employs [[beginTransaction]], [[commitTransaction]],
   * [[rollbackTransaction]], and [[saveTransaction]] to greatly simplify the
   * use of database transactions and automatically handle transaction nesting.
   *
   * @param cb
   * @param isolationLevel
   *   The isolation level that the transaction is to be run with.
   *
   *   The isolation levels are available from `require('tedious').ISOLATION_LEVEL`.
   *   * `READ_UNCOMMITTED`
   *   * `READ_COMMITTED`
   *   * `REPEATABLE_READ`
   *   * `SERIALIZABLE`
   *   * `SNAPSHOT`
   *
   *   Optional, and defaults to the Connection's isolation level.
   */
  transaction(cb, isolationLevel) {
    if (typeof cb !== 'function') {
      throw new TypeError('`cb` must be a function');
    }
    const useSavepoint = this.inTransaction;
    const name = '_tedious_' + _crypto.default.randomBytes(10).toString('hex');
    const txDone = (err, done, ...args) => {
      if (err) {
        if (this.inTransaction && this.state === this.STATE.LOGGED_IN) {
          this.rollbackTransaction(txErr => {
            done(txErr || err, ...args);
          }, name);
        } else {
          done(err, ...args);
        }
      } else if (useSavepoint) {
        if (this.config.options.tdsVersion < '7_2') {
          this.transactionDepth--;
        }
        done(null, ...args);
      } else {
        this.commitTransaction(txErr => {
          done(txErr, ...args);
        }, name);
      }
    };
    if (useSavepoint) {
      return this.saveTransaction(err => {
        if (err) {
          return cb(err);
        }
        if (isolationLevel) {
          return this.execSqlBatch(new _request.default('SET transaction isolation level ' + this.getIsolationLevelText(isolationLevel), err => {
            return cb(err, txDone);
          }));
        } else {
          return cb(null, txDone);
        }
      }, name);
    } else {
      return this.beginTransaction(err => {
        if (err) {
          return cb(err);
        }
        return cb(null, txDone);
      }, name, isolationLevel);
    }
  }

  /**
   * @private
   */
  makeRequest(request, packetType, payload) {
    if (this.state !== this.STATE.LOGGED_IN) {
      const message = 'Requests can only be made in the ' + this.STATE.LOGGED_IN.name + ' state, not the ' + this.state.name + ' state';
      this.debug.log(message);
      request.callback(new _errors.RequestError(message, 'EINVALIDSTATE'));
    } else if (request.canceled) {
      process.nextTick(() => {
        request.callback(new _errors.RequestError('Canceled.', 'ECANCEL'));
      });
    } else {
      if (packetType === _packet.TYPE.SQL_BATCH) {
        this.isSqlBatch = true;
      } else {
        this.isSqlBatch = false;
      }
      this.request = request;
      request.connection = this;
      request.rowCount = 0;
      request.rows = [];
      request.rst = [];
      const onCancel = () => {
        payloadStream.unpipe(message);
        payloadStream.destroy(new _errors.RequestError('Canceled.', 'ECANCEL'));

        // set the ignore bit and end the message.
        message.ignore = true;
        message.end();
        if (request instanceof _request.default && request.paused) {
          // resume the request if it was paused so we can read the remaining tokens
          request.resume();
        }
      };
      request.once('cancel', onCancel);
      this.createRequestTimer();
      const message = new _message.default({
        type: packetType,
        resetConnection: this.resetConnectionOnNextRequest
      });
      this.messageIo.outgoingMessageStream.write(message);
      this.transitionTo(this.STATE.SENT_CLIENT_REQUEST);
      message.once('finish', () => {
        request.removeListener('cancel', onCancel);
        request.once('cancel', this._cancelAfterRequestSent);
        this.resetConnectionOnNextRequest = false;
        this.debug.payload(function () {
          return payload.toString('  ');
        });
      });
      const payloadStream = _stream.Readable.from(payload);
      payloadStream.once('error', error => {
        payloadStream.unpipe(message);

        // Only set a request error if no error was set yet.
        request.error ??= error;
        message.ignore = true;
        message.end();
      });
      payloadStream.pipe(message);
    }
  }

  /**
   * Cancel currently executed request.
   */
  cancel() {
    if (!this.request) {
      return false;
    }
    if (this.request.canceled) {
      return false;
    }
    this.request.cancel();
    return true;
  }

  /**
   * Reset the connection to its initial state.
   * Can be useful for connection pool implementations.
   *
   * @param callback
   */
  reset(callback) {
    const request = new _request.default(this.getInitialSql(), err => {
      if (this.config.options.tdsVersion < '7_2') {
        this.inTransaction = false;
      }
      callback(err);
    });
    this.resetConnectionOnNextRequest = true;
    this.execSqlBatch(request);
  }

  /**
   * @private
   */
  currentTransactionDescriptor() {
    return this.transactionDescriptors[this.transactionDescriptors.length - 1];
  }

  /**
   * @private
   */
  getIsolationLevelText(isolationLevel) {
    switch (isolationLevel) {
      case _transaction.ISOLATION_LEVEL.READ_UNCOMMITTED:
        return 'read uncommitted';
      case _transaction.ISOLATION_LEVEL.REPEATABLE_READ:
        return 'repeatable read';
      case _transaction.ISOLATION_LEVEL.SERIALIZABLE:
        return 'serializable';
      case _transaction.ISOLATION_LEVEL.SNAPSHOT:
        return 'snapshot';
      default:
        return 'read committed';
    }
  }
}
function isTransientError(error) {
  if (error instanceof _esAggregateError.default) {
    error = error.errors[0];
  }
  return error instanceof _errors.ConnectionError && !!error.isTransient;
}
var _default = Connection;
exports.default = _default;
module.exports = Connection;
Connection.prototype.STATE = {
  INITIALIZED: {
    name: 'Initialized',
    events: {}
  },
  CONNECTING: {
    name: 'Connecting',
    enter: function () {
      this.initialiseConnection();
    },
    events: {
      socketError: function () {
        this.transitionTo(this.STATE.FINAL);
      },
      connectTimeout: function () {
        this.transitionTo(this.STATE.FINAL);
      }
    }
  },
  SENT_PRELOGIN: {
    name: 'SentPrelogin',
    enter: function () {
      (async () => {
        let messageBuffer = Buffer.alloc(0);
        let message;
        try {
          message = await this.messageIo.readMessage();
        } catch (err) {
          return this.socketError(err);
        }
        for await (const data of message) {
          messageBuffer = Buffer.concat([messageBuffer, data]);
        }
        const preloginPayload = new _preloginPayload.default(messageBuffer);
        this.debug.payload(function () {
          return preloginPayload.toString('  ');
        });
        if (preloginPayload.fedAuthRequired === 1) {
          this.fedAuthRequired = true;
        }
        if ('strict' !== this.config.options.encrypt && (preloginPayload.encryptionString === 'ON' || preloginPayload.encryptionString === 'REQ')) {
          if (!this.config.options.encrypt) {
            this.emit('connect', new _errors.ConnectionError("Server requires encryption, set 'encrypt' config option to true.", 'EENCRYPT'));
            return this.close();
          }
          try {
            this.transitionTo(this.STATE.SENT_TLSSSLNEGOTIATION);
            await this.messageIo.startTls(this.secureContextOptions, this.config.options.serverName ? this.config.options.serverName : this.routingData?.server ?? this.config.server, this.config.options.trustServerCertificate);
          } catch (err) {
            return this.socketError(err);
          }
        }
        this.sendLogin7Packet();
        const {
          authentication
        } = this.config;
        switch (authentication.type) {
          case 'azure-active-directory-password':
          case 'azure-active-directory-msi-vm':
          case 'azure-active-directory-msi-app-service':
          case 'azure-active-directory-service-principal-secret':
          case 'azure-active-directory-default':
            this.transitionTo(this.STATE.SENT_LOGIN7_WITH_FEDAUTH);
            break;
          case 'ntlm':
            this.transitionTo(this.STATE.SENT_LOGIN7_WITH_NTLM);
            break;
          default:
            this.transitionTo(this.STATE.SENT_LOGIN7_WITH_STANDARD_LOGIN);
            break;
        }
      })().catch(err => {
        process.nextTick(() => {
          throw err;
        });
      });
    },
    events: {
      socketError: function () {
        this.transitionTo(this.STATE.FINAL);
      },
      connectTimeout: function () {
        this.transitionTo(this.STATE.FINAL);
      }
    }
  },
  REROUTING: {
    name: 'ReRouting',
    enter: function () {
      this.cleanupConnection(CLEANUP_TYPE.REDIRECT);
    },
    events: {
      message: function () {},
      socketError: function () {
        this.transitionTo(this.STATE.FINAL);
      },
      connectTimeout: function () {
        this.transitionTo(this.STATE.FINAL);
      },
      reconnect: function () {
        this.transitionTo(this.STATE.CONNECTING);
      }
    }
  },
  TRANSIENT_FAILURE_RETRY: {
    name: 'TRANSIENT_FAILURE_RETRY',
    enter: function () {
      this.curTransientRetryCount++;
      this.cleanupConnection(CLEANUP_TYPE.RETRY);
    },
    events: {
      message: function () {},
      socketError: function () {
        this.transitionTo(this.STATE.FINAL);
      },
      connectTimeout: function () {
        this.transitionTo(this.STATE.FINAL);
      },
      retry: function () {
        this.createRetryTimer();
      }
    }
  },
  SENT_TLSSSLNEGOTIATION: {
    name: 'SentTLSSSLNegotiation',
    events: {
      socketError: function () {
        this.transitionTo(this.STATE.FINAL);
      },
      connectTimeout: function () {
        this.transitionTo(this.STATE.FINAL);
      }
    }
  },
  SENT_LOGIN7_WITH_STANDARD_LOGIN: {
    name: 'SentLogin7WithStandardLogin',
    enter: function () {
      (async () => {
        let message;
        try {
          message = await this.messageIo.readMessage();
        } catch (err) {
          return this.socketError(err);
        }
        const handler = new _handler.Login7TokenHandler(this);
        const tokenStreamParser = this.createTokenStreamParser(message, handler);
        await (0, _events.once)(tokenStreamParser, 'end');
        if (handler.loginAckReceived) {
          if (handler.routingData) {
            this.routingData = handler.routingData;
            this.transitionTo(this.STATE.REROUTING);
          } else {
            this.transitionTo(this.STATE.LOGGED_IN_SENDING_INITIAL_SQL);
          }
        } else if (this.loginError) {
          if (isTransientError(this.loginError)) {
            this.debug.log('Initiating retry on transient error');
            this.transitionTo(this.STATE.TRANSIENT_FAILURE_RETRY);
          } else {
            this.emit('connect', this.loginError);
            this.transitionTo(this.STATE.FINAL);
          }
        } else {
          this.emit('connect', new _errors.ConnectionError('Login failed.', 'ELOGIN'));
          this.transitionTo(this.STATE.FINAL);
        }
      })().catch(err => {
        process.nextTick(() => {
          throw err;
        });
      });
    },
    events: {
      socketError: function () {
        this.transitionTo(this.STATE.FINAL);
      },
      connectTimeout: function () {
        this.transitionTo(this.STATE.FINAL);
      }
    }
  },
  SENT_LOGIN7_WITH_NTLM: {
    name: 'SentLogin7WithNTLMLogin',
    enter: function () {
      (async () => {
        while (true) {
          let message;
          try {
            message = await this.messageIo.readMessage();
          } catch (err) {
            return this.socketError(err);
          }
          const handler = new _handler.Login7TokenHandler(this);
          const tokenStreamParser = this.createTokenStreamParser(message, handler);
          await (0, _events.once)(tokenStreamParser, 'end');
          if (handler.loginAckReceived) {
            if (handler.routingData) {
              this.routingData = handler.routingData;
              return this.transitionTo(this.STATE.REROUTING);
            } else {
              return this.transitionTo(this.STATE.LOGGED_IN_SENDING_INITIAL_SQL);
            }
          } else if (this.ntlmpacket) {
            const authentication = this.config.authentication;
            const payload = new _ntlmPayload.default({
              domain: authentication.options.domain,
              userName: authentication.options.userName,
              password: authentication.options.password,
              ntlmpacket: this.ntlmpacket
            });
            this.messageIo.sendMessage(_packet.TYPE.NTLMAUTH_PKT, payload.data);
            this.debug.payload(function () {
              return payload.toString('  ');
            });
            this.ntlmpacket = undefined;
          } else if (this.loginError) {
            if (isTransientError(this.loginError)) {
              this.debug.log('Initiating retry on transient error');
              return this.transitionTo(this.STATE.TRANSIENT_FAILURE_RETRY);
            } else {
              this.emit('connect', this.loginError);
              return this.transitionTo(this.STATE.FINAL);
            }
          } else {
            this.emit('connect', new _errors.ConnectionError('Login failed.', 'ELOGIN'));
            return this.transitionTo(this.STATE.FINAL);
          }
        }
      })().catch(err => {
        process.nextTick(() => {
          throw err;
        });
      });
    },
    events: {
      socketError: function () {
        this.transitionTo(this.STATE.FINAL);
      },
      connectTimeout: function () {
        this.transitionTo(this.STATE.FINAL);
      }
    }
  },
  SENT_LOGIN7_WITH_FEDAUTH: {
    name: 'SentLogin7Withfedauth',
    enter: function () {
      (async () => {
        let message;
        try {
          message = await this.messageIo.readMessage();
        } catch (err) {
          return this.socketError(err);
        }
        const handler = new _handler.Login7TokenHandler(this);
        const tokenStreamParser = this.createTokenStreamParser(message, handler);
        await (0, _events.once)(tokenStreamParser, 'end');
        if (handler.loginAckReceived) {
          if (handler.routingData) {
            this.routingData = handler.routingData;
            this.transitionTo(this.STATE.REROUTING);
          } else {
            this.transitionTo(this.STATE.LOGGED_IN_SENDING_INITIAL_SQL);
          }
          return;
        }
        const fedAuthInfoToken = handler.fedAuthInfoToken;
        if (fedAuthInfoToken && fedAuthInfoToken.stsurl && fedAuthInfoToken.spn) {
          const authentication = this.config.authentication;
          const tokenScope = new _url.URL('/.default', fedAuthInfoToken.spn).toString();
          let credentials;
          switch (authentication.type) {
            case 'azure-active-directory-password':
              credentials = new _identity.UsernamePasswordCredential(authentication.options.tenantId ?? 'common', authentication.options.clientId, authentication.options.userName, authentication.options.password);
              break;
            case 'azure-active-directory-msi-vm':
            case 'azure-active-directory-msi-app-service':
              const msiArgs = authentication.options.clientId ? [authentication.options.clientId, {}] : [{}];
              credentials = new _identity.ManagedIdentityCredential(...msiArgs);
              break;
            case 'azure-active-directory-default':
              const args = authentication.options.clientId ? {
                managedIdentityClientId: authentication.options.clientId
              } : {};
              credentials = new _identity.DefaultAzureCredential(args);
              break;
            case 'azure-active-directory-service-principal-secret':
              credentials = new _identity.ClientSecretCredential(authentication.options.tenantId, authentication.options.clientId, authentication.options.clientSecret);
              break;
          }
          let tokenResponse;
          try {
            tokenResponse = await credentials.getToken(tokenScope);
          } catch (err) {
            this.loginError = new _esAggregateError.default([new _errors.ConnectionError('Security token could not be authenticated or authorized.', 'EFEDAUTH'), err]);
            this.emit('connect', this.loginError);
            this.transitionTo(this.STATE.FINAL);
            return;
          }
          const token = tokenResponse.token;
          this.sendFedAuthTokenMessage(token);
        } else if (this.loginError) {
          if (isTransientError(this.loginError)) {
            this.debug.log('Initiating retry on transient error');
            this.transitionTo(this.STATE.TRANSIENT_FAILURE_RETRY);
          } else {
            this.emit('connect', this.loginError);
            this.transitionTo(this.STATE.FINAL);
          }
        } else {
          this.emit('connect', new _errors.ConnectionError('Login failed.', 'ELOGIN'));
          this.transitionTo(this.STATE.FINAL);
        }
      })().catch(err => {
        process.nextTick(() => {
          throw err;
        });
      });
    },
    events: {
      socketError: function () {
        this.transitionTo(this.STATE.FINAL);
      },
      connectTimeout: function () {
        this.transitionTo(this.STATE.FINAL);
      }
    }
  },
  LOGGED_IN_SENDING_INITIAL_SQL: {
    name: 'LoggedInSendingInitialSql',
    enter: function () {
      (async () => {
        this.sendInitialSql();
        let message;
        try {
          message = await this.messageIo.readMessage();
        } catch (err) {
          return this.socketError(err);
        }
        const tokenStreamParser = this.createTokenStreamParser(message, new _handler.InitialSqlTokenHandler(this));
        await (0, _events.once)(tokenStreamParser, 'end');
        this.transitionTo(this.STATE.LOGGED_IN);
        this.processedInitialSql();
      })().catch(err => {
        process.nextTick(() => {
          throw err;
        });
      });
    },
    events: {
      socketError: function socketError() {
        this.transitionTo(this.STATE.FINAL);
      },
      connectTimeout: function () {
        this.transitionTo(this.STATE.FINAL);
      }
    }
  },
  LOGGED_IN: {
    name: 'LoggedIn',
    events: {
      socketError: function () {
        this.transitionTo(this.STATE.FINAL);
      }
    }
  },
  SENT_CLIENT_REQUEST: {
    name: 'SentClientRequest',
    enter: function () {
      (async () => {
        let message;
        try {
          message = await this.messageIo.readMessage();
        } catch (err) {
          return this.socketError(err);
        }
        // request timer is stopped on first data package
        this.clearRequestTimer();
        const tokenStreamParser = this.createTokenStreamParser(message, new _handler.RequestTokenHandler(this, this.request));

        // If the request was canceled and we have a `cancelTimer`
        // defined, we send a attention message after the
        // request message was fully sent off.
        //
        // We already started consuming the current message
        // (but all the token handlers should be no-ops), and
        // need to ensure the next message is handled by the
        // `SENT_ATTENTION` state.
        if (this.request?.canceled && this.cancelTimer) {
          return this.transitionTo(this.STATE.SENT_ATTENTION);
        }
        const onResume = () => {
          tokenStreamParser.resume();
        };
        const onPause = () => {
          tokenStreamParser.pause();
          this.request?.once('resume', onResume);
        };
        this.request?.on('pause', onPause);
        if (this.request instanceof _request.default && this.request.paused) {
          onPause();
        }
        const onCancel = () => {
          tokenStreamParser.removeListener('end', onEndOfMessage);
          if (this.request instanceof _request.default && this.request.paused) {
            // resume the request if it was paused so we can read the remaining tokens
            this.request.resume();
          }
          this.request?.removeListener('pause', onPause);
          this.request?.removeListener('resume', onResume);

          // The `_cancelAfterRequestSent` callback will have sent a
          // attention message, so now we need to also switch to
          // the `SENT_ATTENTION` state to make sure the attention ack
          // message is processed correctly.
          this.transitionTo(this.STATE.SENT_ATTENTION);
        };
        const onEndOfMessage = () => {
          this.request?.removeListener('cancel', this._cancelAfterRequestSent);
          this.request?.removeListener('cancel', onCancel);
          this.request?.removeListener('pause', onPause);
          this.request?.removeListener('resume', onResume);
          this.transitionTo(this.STATE.LOGGED_IN);
          const sqlRequest = this.request;
          this.request = undefined;
          if (this.config.options.tdsVersion < '7_2' && sqlRequest.error && this.isSqlBatch) {
            this.inTransaction = false;
          }
          sqlRequest.callback(sqlRequest.error, sqlRequest.rowCount, sqlRequest.rows);
        };
        tokenStreamParser.once('end', onEndOfMessage);
        this.request?.once('cancel', onCancel);
      })();
    },
    exit: function (nextState) {
      this.clearRequestTimer();
    },
    events: {
      socketError: function (err) {
        const sqlRequest = this.request;
        this.request = undefined;
        this.transitionTo(this.STATE.FINAL);
        sqlRequest.callback(err);
      }
    }
  },
  SENT_ATTENTION: {
    name: 'SentAttention',
    enter: function () {
      (async () => {
        let message;
        try {
          message = await this.messageIo.readMessage();
        } catch (err) {
          return this.socketError(err);
        }
        const handler = new _handler.AttentionTokenHandler(this, this.request);
        const tokenStreamParser = this.createTokenStreamParser(message, handler);
        await (0, _events.once)(tokenStreamParser, 'end');
        // 3.2.5.7 Sent Attention State
        // Discard any data contained in the response, until we receive the attention response
        if (handler.attentionReceived) {
          this.clearCancelTimer();
          const sqlRequest = this.request;
          this.request = undefined;
          this.transitionTo(this.STATE.LOGGED_IN);
          if (sqlRequest.error && sqlRequest.error instanceof _errors.RequestError && sqlRequest.error.code === 'ETIMEOUT') {
            sqlRequest.callback(sqlRequest.error);
          } else {
            sqlRequest.callback(new _errors.RequestError('Canceled.', 'ECANCEL'));
          }
        }
      })().catch(err => {
        process.nextTick(() => {
          throw err;
        });
      });
    },
    events: {
      socketError: function (err) {
        const sqlRequest = this.request;
        this.request = undefined;
        this.transitionTo(this.STATE.FINAL);
        sqlRequest.callback(err);
      }
    }
  },
  FINAL: {
    name: 'Final',
    enter: function () {
      this.cleanupConnection(CLEANUP_TYPE.NORMAL);
    },
    events: {
      connectTimeout: function () {
        // Do nothing, as the timer should be cleaned up.
      },
      message: function () {
        // Do nothing
      },
      socketError: function () {
        // Do nothing
      }
    }
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfY3J5cHRvIiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfb3MiLCJ0bHMiLCJfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZCIsIm5ldCIsIl9kbnMiLCJfY29uc3RhbnRzIiwiX3N0cmVhbSIsIl9pZGVudGl0eSIsIl9idWxrTG9hZCIsIl9kZWJ1ZyIsIl9ldmVudHMiLCJfaW5zdGFuY2VMb29rdXAiLCJfdHJhbnNpZW50RXJyb3JMb29rdXAiLCJfcGFja2V0IiwiX3ByZWxvZ2luUGF5bG9hZCIsIl9sb2dpbjdQYXlsb2FkIiwiX250bG1QYXlsb2FkIiwiX3JlcXVlc3QiLCJfcnBjcmVxdWVzdFBheWxvYWQiLCJfc3FsYmF0Y2hQYXlsb2FkIiwiX21lc3NhZ2VJbyIsIl90b2tlblN0cmVhbVBhcnNlciIsIl90cmFuc2FjdGlvbiIsIl9lcnJvcnMiLCJfY29ubmVjdG9yIiwiX2xpYnJhcnkiLCJfdGRzVmVyc2lvbnMiLCJfbWVzc2FnZSIsIl9udGxtIiwiX25vZGVBYm9ydENvbnRyb2xsZXIiLCJfZGF0YVR5cGUiLCJfYnVsa0xvYWRQYXlsb2FkIiwiX3NwZWNpYWxTdG9yZWRQcm9jZWR1cmUiLCJfZXNBZ2dyZWdhdGVFcnJvciIsIl9wYWNrYWdlIiwiX3VybCIsIl9oYW5kbGVyIiwiX2dldFJlcXVpcmVXaWxkY2FyZENhY2hlIiwibm9kZUludGVyb3AiLCJXZWFrTWFwIiwiY2FjaGVCYWJlbEludGVyb3AiLCJjYWNoZU5vZGVJbnRlcm9wIiwib2JqIiwiX19lc01vZHVsZSIsImRlZmF1bHQiLCJjYWNoZSIsImhhcyIsImdldCIsIm5ld09iaiIsImhhc1Byb3BlcnR5RGVzY3JpcHRvciIsIk9iamVjdCIsImRlZmluZVByb3BlcnR5IiwiZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIiwia2V5IiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwiZGVzYyIsInNldCIsIktFRVBfQUxJVkVfSU5JVElBTF9ERUxBWSIsIkRFRkFVTFRfQ09OTkVDVF9USU1FT1VUIiwiREVGQVVMVF9DTElFTlRfUkVRVUVTVF9USU1FT1VUIiwiREVGQVVMVF9DQU5DRUxfVElNRU9VVCIsIkRFRkFVTFRfQ09OTkVDVF9SRVRSWV9JTlRFUlZBTCIsIkRFRkFVTFRfUEFDS0VUX1NJWkUiLCJERUZBVUxUX1RFWFRTSVpFIiwiREVGQVVMVF9EQVRFRklSU1QiLCJERUZBVUxUX1BPUlQiLCJERUZBVUxUX1REU19WRVJTSU9OIiwiREVGQVVMVF9MQU5HVUFHRSIsIkRFRkFVTFRfREFURUZPUk1BVCIsIkNMRUFOVVBfVFlQRSIsIk5PUk1BTCIsIlJFRElSRUNUIiwiUkVUUlkiLCJDb25uZWN0aW9uIiwiRXZlbnRFbWl0dGVyIiwiX2NhbmNlbEFmdGVyUmVxdWVzdFNlbnQiLCJjb25zdHJ1Y3RvciIsImNvbmZpZyIsIlR5cGVFcnJvciIsInNlcnZlciIsImZlZEF1dGhSZXF1aXJlZCIsImF1dGhlbnRpY2F0aW9uIiwidW5kZWZpbmVkIiwidHlwZSIsIm9wdGlvbnMiLCJkb21haW4iLCJ1c2VyTmFtZSIsInBhc3N3b3JkIiwidG9VcHBlckNhc2UiLCJjbGllbnRJZCIsInRlbmFudElkIiwidG9rZW4iLCJjbGllbnRTZWNyZXQiLCJhYm9ydFRyYW5zYWN0aW9uT25FcnJvciIsImFwcE5hbWUiLCJjYW1lbENhc2VDb2x1bW5zIiwiY2FuY2VsVGltZW91dCIsImNvbHVtbkVuY3J5cHRpb25LZXlDYWNoZVRUTCIsImNvbHVtbkVuY3J5cHRpb25TZXR0aW5nIiwiY29sdW1uTmFtZVJlcGxhY2VyIiwiY29ubmVjdGlvblJldHJ5SW50ZXJ2YWwiLCJjb25uZWN0VGltZW91dCIsImNvbm5lY3RvciIsImNvbm5lY3Rpb25Jc29sYXRpb25MZXZlbCIsIklTT0xBVElPTl9MRVZFTCIsIlJFQURfQ09NTUlUVEVEIiwiY3J5cHRvQ3JlZGVudGlhbHNEZXRhaWxzIiwiZGF0YWJhc2UiLCJkYXRlZmlyc3QiLCJkYXRlRm9ybWF0IiwiZGVidWciLCJkYXRhIiwicGFja2V0IiwicGF5bG9hZCIsImVuYWJsZUFuc2lOdWxsIiwiZW5hYmxlQW5zaU51bGxEZWZhdWx0IiwiZW5hYmxlQW5zaVBhZGRpbmciLCJlbmFibGVBbnNpV2FybmluZ3MiLCJlbmFibGVBcml0aEFib3J0IiwiZW5hYmxlQ29uY2F0TnVsbFlpZWxkc051bGwiLCJlbmFibGVDdXJzb3JDbG9zZU9uQ29tbWl0IiwiZW5hYmxlSW1wbGljaXRUcmFuc2FjdGlvbnMiLCJlbmFibGVOdW1lcmljUm91bmRhYm9ydCIsImVuYWJsZVF1b3RlZElkZW50aWZpZXIiLCJlbmNyeXB0IiwiZmFsbGJhY2tUb0RlZmF1bHREYiIsImVuY3J5cHRpb25LZXlTdG9yZVByb3ZpZGVycyIsImluc3RhbmNlTmFtZSIsImlzb2xhdGlvbkxldmVsIiwibGFuZ3VhZ2UiLCJsb2NhbEFkZHJlc3MiLCJtYXhSZXRyaWVzT25UcmFuc2llbnRFcnJvcnMiLCJtdWx0aVN1Ym5ldEZhaWxvdmVyIiwicGFja2V0U2l6ZSIsInBvcnQiLCJyZWFkT25seUludGVudCIsInJlcXVlc3RUaW1lb3V0Iiwicm93Q29sbGVjdGlvbk9uRG9uZSIsInJvd0NvbGxlY3Rpb25PblJlcXVlc3RDb21wbGV0aW9uIiwic2VydmVyTmFtZSIsInNlcnZlclN1cHBvcnRzQ29sdW1uRW5jcnlwdGlvbiIsInRkc1ZlcnNpb24iLCJ0ZXh0c2l6ZSIsInRydXN0ZWRTZXJ2ZXJOYW1lQUUiLCJ0cnVzdFNlcnZlckNlcnRpZmljYXRlIiwidXNlQ29sdW1uTmFtZXMiLCJ1c2VVVEMiLCJ3b3Jrc3RhdGlvbklkIiwibG93ZXJDYXNlR3VpZHMiLCJFcnJvciIsImFzc2VydFZhbGlkSXNvbGF0aW9uTGV2ZWwiLCJSYW5nZUVycm9yIiwic2VjdXJlQ29udGV4dE9wdGlvbnMiLCJzZWN1cmVPcHRpb25zIiwiY3JlYXRlIiwidmFsdWUiLCJjb25zdGFudHMiLCJTU0xfT1BfRE9OVF9JTlNFUlRfRU1QVFlfRlJBR01FTlRTIiwiY3JlYXRlRGVidWciLCJpblRyYW5zYWN0aW9uIiwidHJhbnNhY3Rpb25EZXNjcmlwdG9ycyIsIkJ1ZmZlciIsImZyb20iLCJ0cmFuc2FjdGlvbkRlcHRoIiwiaXNTcWxCYXRjaCIsImNsb3NlZCIsIm1lc3NhZ2VCdWZmZXIiLCJhbGxvYyIsImN1clRyYW5zaWVudFJldHJ5Q291bnQiLCJ0cmFuc2llbnRFcnJvckxvb2t1cCIsIlRyYW5zaWVudEVycm9yTG9va3VwIiwic3RhdGUiLCJTVEFURSIsIklOSVRJQUxJWkVEIiwibWVzc2FnZUlvIiwic2VuZE1lc3NhZ2UiLCJUWVBFIiwiQVRURU5USU9OIiwiY3JlYXRlQ2FuY2VsVGltZXIiLCJjb25uZWN0IiwiY29ubmVjdExpc3RlbmVyIiwiQ29ubmVjdGlvbkVycm9yIiwibmFtZSIsIm9uQ29ubmVjdCIsImVyciIsInJlbW92ZUxpc3RlbmVyIiwib25FcnJvciIsIm9uY2UiLCJ0cmFuc2l0aW9uVG8iLCJDT05ORUNUSU5HIiwib24iLCJldmVudCIsImxpc3RlbmVyIiwiZW1pdCIsImFyZ3MiLCJjbG9zZSIsIkZJTkFMIiwiaW5pdGlhbGlzZUNvbm5lY3Rpb24iLCJzaWduYWwiLCJjcmVhdGVDb25uZWN0VGltZXIiLCJjb25uZWN0T25Qb3J0IiwiaW5zdGFuY2VMb29rdXAiLCJ0aW1lb3V0IiwidGhlbiIsInByb2Nlc3MiLCJuZXh0VGljayIsImNsZWFyQ29ubmVjdFRpbWVyIiwiYWJvcnRlZCIsIm1lc3NhZ2UiLCJjbGVhbnVwQ29ubmVjdGlvbiIsImNsZWFudXBUeXBlIiwiY2xlYXJSZXF1ZXN0VGltZXIiLCJjbGVhclJldHJ5VGltZXIiLCJjbG9zZUNvbm5lY3Rpb24iLCJyZXF1ZXN0IiwiUmVxdWVzdEVycm9yIiwiY2FsbGJhY2siLCJsb2dpbkVycm9yIiwiRGVidWciLCJjcmVhdGVUb2tlblN0cmVhbVBhcnNlciIsImhhbmRsZXIiLCJUb2tlblN0cmVhbVBhcnNlciIsInNvY2tldEhhbmRsaW5nRm9yU2VuZFByZUxvZ2luIiwic29ja2V0IiwiZXJyb3IiLCJzb2NrZXRFcnJvciIsInNvY2tldENsb3NlIiwic29ja2V0RW5kIiwic2V0S2VlcEFsaXZlIiwiTWVzc2FnZUlPIiwiY2xlYXJ0ZXh0IiwibG9nIiwic2VuZFByZUxvZ2luIiwiU0VOVF9QUkVMT0dJTiIsIndyYXBXaXRoVGxzIiwidGhyb3dJZkFib3J0ZWQiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsInNlY3VyZUNvbnRleHQiLCJjcmVhdGVTZWN1cmVDb250ZXh0IiwiaXNJUCIsImVuY3J5cHRPcHRpb25zIiwiaG9zdCIsIkFMUE5Qcm90b2NvbHMiLCJzZXJ2ZXJuYW1lIiwiZW5jcnlwdHNvY2tldCIsIm9uQWJvcnQiLCJkZXN0cm95IiwicmVhc29uIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImFkZEV2ZW50TGlzdGVuZXIiLCJjdXN0b21Db25uZWN0b3IiLCJjb25uZWN0T3B0cyIsInJvdXRpbmdEYXRhIiwiY29ubmVjdEluUGFyYWxsZWwiLCJjb25uZWN0SW5TZXF1ZW5jZSIsImRucyIsImxvb2t1cCIsImVuZCIsImNhdGNoIiwiY29udHJvbGxlciIsIkFib3J0Q29udHJvbGxlciIsImNvbm5lY3RUaW1lciIsInNldFRpbWVvdXQiLCJhYm9ydCIsImNsZWFyQ2FuY2VsVGltZXIiLCJjYW5jZWxUaW1lciIsImNyZWF0ZVJlcXVlc3RUaW1lciIsInJlcXVlc3RUaW1lciIsImNyZWF0ZVJldHJ5VGltZXIiLCJyZXRyeVRpbWVyIiwicmV0cnlUaW1lb3V0IiwiaG9zdFBvc3RmaXgiLCJyb3V0aW5nTWVzc2FnZSIsImRpc3BhdGNoRXZlbnQiLCJjYW5jZWwiLCJjbGVhclRpbWVvdXQiLCJuZXdTdGF0ZSIsImV4aXQiLCJlbnRlciIsImFwcGx5IiwiZ2V0RXZlbnRIYW5kbGVyIiwiZXZlbnROYW1lIiwiZXZlbnRzIiwiU0VOVF9UTFNTU0xORUdPVElBVElPTiIsImNvZGUiLCJSRVJPVVRJTkciLCJUUkFOU0lFTlRfRkFJTFVSRV9SRVRSWSIsIm1ham9yIiwibWlub3IiLCJidWlsZCIsImV4ZWMiLCJ2ZXJzaW9uIiwiUHJlbG9naW5QYXlsb2FkIiwiTnVtYmVyIiwic3ViYnVpbGQiLCJQUkVMT0dJTiIsInRvU3RyaW5nIiwic2VuZExvZ2luN1BhY2tldCIsIkxvZ2luN1BheWxvYWQiLCJ2ZXJzaW9ucyIsImNsaWVudFByb2dWZXIiLCJjbGllbnRQaWQiLCJwaWQiLCJjb25uZWN0aW9uSWQiLCJjbGllbnRUaW1lWm9uZSIsIkRhdGUiLCJnZXRUaW1lem9uZU9mZnNldCIsImNsaWVudExjaWQiLCJmZWRBdXRoIiwiZWNobyIsIndvcmtmbG93IiwiZmVkQXV0aFRva2VuIiwic3NwaSIsImNyZWF0ZU5UTE1SZXF1ZXN0IiwiaG9zdG5hbWUiLCJvcyIsImxpYnJhcnlOYW1lIiwiaW5pdERiRmF0YWwiLCJMT0dJTjciLCJ0b0J1ZmZlciIsInNlbmRGZWRBdXRoVG9rZW5NZXNzYWdlIiwiYWNjZXNzVG9rZW5MZW4iLCJieXRlTGVuZ3RoIiwib2Zmc2V0Iiwid3JpdGVVSW50MzJMRSIsIndyaXRlIiwiRkVEQVVUSF9UT0tFTiIsIlNFTlRfTE9HSU43X1dJVEhfU1RBTkRBUkRfTE9HSU4iLCJzZW5kSW5pdGlhbFNxbCIsIlNxbEJhdGNoUGF5bG9hZCIsImdldEluaXRpYWxTcWwiLCJjdXJyZW50VHJhbnNhY3Rpb25EZXNjcmlwdG9yIiwiTWVzc2FnZSIsIlNRTF9CQVRDSCIsIm91dGdvaW5nTWVzc2FnZVN0cmVhbSIsIlJlYWRhYmxlIiwicGlwZSIsInB1c2giLCJnZXRJc29sYXRpb25MZXZlbFRleHQiLCJqb2luIiwicHJvY2Vzc2VkSW5pdGlhbFNxbCIsImV4ZWNTcWxCYXRjaCIsIm1ha2VSZXF1ZXN0Iiwic3FsVGV4dE9yUHJvY2VkdXJlIiwiZXhlY1NxbCIsInZhbGlkYXRlUGFyYW1ldGVycyIsImRhdGFiYXNlQ29sbGF0aW9uIiwicGFyYW1ldGVycyIsIlRZUEVTIiwiTlZhckNoYXIiLCJvdXRwdXQiLCJsZW5ndGgiLCJwcmVjaXNpb24iLCJzY2FsZSIsIm1ha2VQYXJhbXNQYXJhbWV0ZXIiLCJSUENfUkVRVUVTVCIsIlJwY1JlcXVlc3RQYXlsb2FkIiwiUHJvY2VkdXJlcyIsIlNwX0V4ZWN1dGVTcWwiLCJuZXdCdWxrTG9hZCIsInRhYmxlIiwiY2FsbGJhY2tPck9wdGlvbnMiLCJCdWxrTG9hZCIsImV4ZWNCdWxrTG9hZCIsImJ1bGtMb2FkIiwicm93cyIsImV4ZWN1dGlvblN0YXJ0ZWQiLCJzdHJlYW1pbmdNb2RlIiwiZmlyc3RSb3dXcml0dGVuIiwicm93U3RyZWFtIiwicm93VG9QYWNrZXRUcmFuc2Zvcm0iLCJvbkNhbmNlbCIsIkJ1bGtMb2FkUGF5bG9hZCIsIlJlcXVlc3QiLCJnZXRCdWxrSW5zZXJ0U3FsIiwiQlVMS19MT0FEIiwicHJlcGFyZSIsIkludCIsInByZXBhcmluZyIsImhhbmRsZSIsIlNwX1ByZXBhcmUiLCJ1bnByZXBhcmUiLCJTcF9VbnByZXBhcmUiLCJleGVjdXRlIiwiZXhlY3V0ZVBhcmFtZXRlcnMiLCJpIiwibGVuIiwicGFyYW1ldGVyIiwidmFsaWRhdGUiLCJTcF9FeGVjdXRlIiwiY2FsbFByb2NlZHVyZSIsImJlZ2luVHJhbnNhY3Rpb24iLCJ0cmFuc2FjdGlvbiIsIlRyYW5zYWN0aW9uIiwiaXNvbGF0aW9uTGV2ZWxUb1RTUUwiLCJUUkFOU0FDVElPTl9NQU5BR0VSIiwiYmVnaW5QYXlsb2FkIiwiY29tbWl0VHJhbnNhY3Rpb24iLCJjb21taXRQYXlsb2FkIiwicm9sbGJhY2tUcmFuc2FjdGlvbiIsInJvbGxiYWNrUGF5bG9hZCIsInNhdmVUcmFuc2FjdGlvbiIsInNhdmVQYXlsb2FkIiwiY2IiLCJ1c2VTYXZlcG9pbnQiLCJjcnlwdG8iLCJyYW5kb21CeXRlcyIsInR4RG9uZSIsImRvbmUiLCJMT0dHRURfSU4iLCJ0eEVyciIsInBhY2tldFR5cGUiLCJjYW5jZWxlZCIsImNvbm5lY3Rpb24iLCJyb3dDb3VudCIsInJzdCIsInBheWxvYWRTdHJlYW0iLCJ1bnBpcGUiLCJpZ25vcmUiLCJwYXVzZWQiLCJyZXN1bWUiLCJyZXNldENvbm5lY3Rpb24iLCJyZXNldENvbm5lY3Rpb25Pbk5leHRSZXF1ZXN0IiwiU0VOVF9DTElFTlRfUkVRVUVTVCIsInJlc2V0IiwiUkVBRF9VTkNPTU1JVFRFRCIsIlJFUEVBVEFCTEVfUkVBRCIsIlNFUklBTElaQUJMRSIsIlNOQVBTSE9UIiwiaXNUcmFuc2llbnRFcnJvciIsIkFnZ3JlZ2F0ZUVycm9yIiwiZXJyb3JzIiwiaXNUcmFuc2llbnQiLCJfZGVmYXVsdCIsImV4cG9ydHMiLCJtb2R1bGUiLCJyZWFkTWVzc2FnZSIsImNvbmNhdCIsInByZWxvZ2luUGF5bG9hZCIsImVuY3J5cHRpb25TdHJpbmciLCJzdGFydFRscyIsIlNFTlRfTE9HSU43X1dJVEhfRkVEQVVUSCIsIlNFTlRfTE9HSU43X1dJVEhfTlRMTSIsInJlY29ubmVjdCIsInJldHJ5IiwiTG9naW43VG9rZW5IYW5kbGVyIiwidG9rZW5TdHJlYW1QYXJzZXIiLCJsb2dpbkFja1JlY2VpdmVkIiwiTE9HR0VEX0lOX1NFTkRJTkdfSU5JVElBTF9TUUwiLCJudGxtcGFja2V0IiwiTlRMTVJlc3BvbnNlUGF5bG9hZCIsIk5UTE1BVVRIX1BLVCIsImZlZEF1dGhJbmZvVG9rZW4iLCJzdHN1cmwiLCJzcG4iLCJ0b2tlblNjb3BlIiwiVVJMIiwiY3JlZGVudGlhbHMiLCJVc2VybmFtZVBhc3N3b3JkQ3JlZGVudGlhbCIsIm1zaUFyZ3MiLCJNYW5hZ2VkSWRlbnRpdHlDcmVkZW50aWFsIiwibWFuYWdlZElkZW50aXR5Q2xpZW50SWQiLCJEZWZhdWx0QXp1cmVDcmVkZW50aWFsIiwiQ2xpZW50U2VjcmV0Q3JlZGVudGlhbCIsInRva2VuUmVzcG9uc2UiLCJnZXRUb2tlbiIsIkluaXRpYWxTcWxUb2tlbkhhbmRsZXIiLCJSZXF1ZXN0VG9rZW5IYW5kbGVyIiwiU0VOVF9BVFRFTlRJT04iLCJvblJlc3VtZSIsIm9uUGF1c2UiLCJwYXVzZSIsIm9uRW5kT2ZNZXNzYWdlIiwic3FsUmVxdWVzdCIsIm5leHRTdGF0ZSIsIkF0dGVudGlvblRva2VuSGFuZGxlciIsImF0dGVudGlvblJlY2VpdmVkIl0sInNvdXJjZXMiOlsiLi4vc3JjL2Nvbm5lY3Rpb24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNyeXB0byBmcm9tICdjcnlwdG8nO1xuaW1wb3J0IG9zIGZyb20gJ29zJztcbmltcG9ydCAqIGFzIHRscyBmcm9tICd0bHMnO1xuaW1wb3J0ICogYXMgbmV0IGZyb20gJ25ldCc7XG5pbXBvcnQgZG5zIGZyb20gJ2Rucyc7XG5cbmltcG9ydCBjb25zdGFudHMgZnJvbSAnY29uc3RhbnRzJztcbmltcG9ydCB7IHR5cGUgU2VjdXJlQ29udGV4dE9wdGlvbnMgfSBmcm9tICd0bHMnO1xuXG5pbXBvcnQgeyBSZWFkYWJsZSB9IGZyb20gJ3N0cmVhbSc7XG5cbmltcG9ydCB7XG4gIERlZmF1bHRBenVyZUNyZWRlbnRpYWwsXG4gIENsaWVudFNlY3JldENyZWRlbnRpYWwsXG4gIE1hbmFnZWRJZGVudGl0eUNyZWRlbnRpYWwsXG4gIFVzZXJuYW1lUGFzc3dvcmRDcmVkZW50aWFsLFxufSBmcm9tICdAYXp1cmUvaWRlbnRpdHknO1xuXG5pbXBvcnQgQnVsa0xvYWQsIHsgdHlwZSBPcHRpb25zIGFzIEJ1bGtMb2FkT3B0aW9ucywgdHlwZSBDYWxsYmFjayBhcyBCdWxrTG9hZENhbGxiYWNrIH0gZnJvbSAnLi9idWxrLWxvYWQnO1xuaW1wb3J0IERlYnVnIGZyb20gJy4vZGVidWcnO1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyLCBvbmNlIH0gZnJvbSAnZXZlbnRzJztcbmltcG9ydCB7IGluc3RhbmNlTG9va3VwIH0gZnJvbSAnLi9pbnN0YW5jZS1sb29rdXAnO1xuaW1wb3J0IHsgVHJhbnNpZW50RXJyb3JMb29rdXAgfSBmcm9tICcuL3RyYW5zaWVudC1lcnJvci1sb29rdXAnO1xuaW1wb3J0IHsgVFlQRSB9IGZyb20gJy4vcGFja2V0JztcbmltcG9ydCBQcmVsb2dpblBheWxvYWQgZnJvbSAnLi9wcmVsb2dpbi1wYXlsb2FkJztcbmltcG9ydCBMb2dpbjdQYXlsb2FkIGZyb20gJy4vbG9naW43LXBheWxvYWQnO1xuaW1wb3J0IE5UTE1SZXNwb25zZVBheWxvYWQgZnJvbSAnLi9udGxtLXBheWxvYWQnO1xuaW1wb3J0IFJlcXVlc3QgZnJvbSAnLi9yZXF1ZXN0JztcbmltcG9ydCBScGNSZXF1ZXN0UGF5bG9hZCBmcm9tICcuL3JwY3JlcXVlc3QtcGF5bG9hZCc7XG5pbXBvcnQgU3FsQmF0Y2hQYXlsb2FkIGZyb20gJy4vc3FsYmF0Y2gtcGF5bG9hZCc7XG5pbXBvcnQgTWVzc2FnZUlPIGZyb20gJy4vbWVzc2FnZS1pbyc7XG5pbXBvcnQgeyBQYXJzZXIgYXMgVG9rZW5TdHJlYW1QYXJzZXIgfSBmcm9tICcuL3Rva2VuL3Rva2VuLXN0cmVhbS1wYXJzZXInO1xuaW1wb3J0IHsgVHJhbnNhY3Rpb24sIElTT0xBVElPTl9MRVZFTCwgYXNzZXJ0VmFsaWRJc29sYXRpb25MZXZlbCB9IGZyb20gJy4vdHJhbnNhY3Rpb24nO1xuaW1wb3J0IHsgQ29ubmVjdGlvbkVycm9yLCBSZXF1ZXN0RXJyb3IgfSBmcm9tICcuL2Vycm9ycyc7XG5pbXBvcnQgeyBjb25uZWN0SW5QYXJhbGxlbCwgY29ubmVjdEluU2VxdWVuY2UgfSBmcm9tICcuL2Nvbm5lY3Rvcic7XG5pbXBvcnQgeyBuYW1lIGFzIGxpYnJhcnlOYW1lIH0gZnJvbSAnLi9saWJyYXJ5JztcbmltcG9ydCB7IHZlcnNpb25zIH0gZnJvbSAnLi90ZHMtdmVyc2lvbnMnO1xuaW1wb3J0IE1lc3NhZ2UgZnJvbSAnLi9tZXNzYWdlJztcbmltcG9ydCB7IHR5cGUgTWV0YWRhdGEgfSBmcm9tICcuL21ldGFkYXRhLXBhcnNlcic7XG5pbXBvcnQgeyBjcmVhdGVOVExNUmVxdWVzdCB9IGZyb20gJy4vbnRsbSc7XG5pbXBvcnQgeyBDb2x1bW5FbmNyeXB0aW9uQXp1cmVLZXlWYXVsdFByb3ZpZGVyIH0gZnJvbSAnLi9hbHdheXMtZW5jcnlwdGVkL2tleXN0b3JlLXByb3ZpZGVyLWF6dXJlLWtleS12YXVsdCc7XG5cbmltcG9ydCB7IEFib3J0Q29udHJvbGxlciwgQWJvcnRTaWduYWwgfSBmcm9tICdub2RlLWFib3J0LWNvbnRyb2xsZXInO1xuaW1wb3J0IHsgdHlwZSBQYXJhbWV0ZXIsIFRZUEVTIH0gZnJvbSAnLi9kYXRhLXR5cGUnO1xuaW1wb3J0IHsgQnVsa0xvYWRQYXlsb2FkIH0gZnJvbSAnLi9idWxrLWxvYWQtcGF5bG9hZCc7XG5pbXBvcnQgeyBDb2xsYXRpb24gfSBmcm9tICcuL2NvbGxhdGlvbic7XG5pbXBvcnQgUHJvY2VkdXJlcyBmcm9tICcuL3NwZWNpYWwtc3RvcmVkLXByb2NlZHVyZSc7XG5cbmltcG9ydCBBZ2dyZWdhdGVFcnJvciBmcm9tICdlcy1hZ2dyZWdhdGUtZXJyb3InO1xuaW1wb3J0IHsgdmVyc2lvbiB9IGZyb20gJy4uL3BhY2thZ2UuanNvbic7XG5pbXBvcnQgeyBVUkwgfSBmcm9tICd1cmwnO1xuaW1wb3J0IHsgQXR0ZW50aW9uVG9rZW5IYW5kbGVyLCBJbml0aWFsU3FsVG9rZW5IYW5kbGVyLCBMb2dpbjdUb2tlbkhhbmRsZXIsIFJlcXVlc3RUb2tlbkhhbmRsZXIsIFRva2VuSGFuZGxlciB9IGZyb20gJy4vdG9rZW4vaGFuZGxlcic7XG5cbnR5cGUgQmVnaW5UcmFuc2FjdGlvbkNhbGxiYWNrID1cbiAgLyoqXG4gICAqIFRoZSBjYWxsYmFjayBpcyBjYWxsZWQgd2hlbiB0aGUgcmVxdWVzdCB0byBzdGFydCB0aGUgdHJhbnNhY3Rpb24gaGFzIGNvbXBsZXRlZCxcbiAgICogZWl0aGVyIHN1Y2Nlc3NmdWxseSBvciB3aXRoIGFuIGVycm9yLlxuICAgKiBJZiBhbiBlcnJvciBvY2N1cnJlZCB0aGVuIGBlcnJgIHdpbGwgZGVzY3JpYmUgdGhlIGVycm9yLlxuICAgKlxuICAgKiBBcyBvbmx5IG9uZSByZXF1ZXN0IGF0IGEgdGltZSBtYXkgYmUgZXhlY3V0ZWQgb24gYSBjb25uZWN0aW9uLCBhbm90aGVyIHJlcXVlc3Qgc2hvdWxkIG5vdFxuICAgKiBiZSBpbml0aWF0ZWQgdW50aWwgdGhpcyBjYWxsYmFjayBpcyBjYWxsZWQuXG4gICAqXG4gICAqIEBwYXJhbSBlcnIgSWYgYW4gZXJyb3Igb2NjdXJyZWQsIGFuIFtbRXJyb3JdXSBvYmplY3Qgd2l0aCBkZXRhaWxzIG9mIHRoZSBlcnJvci5cbiAgICogQHBhcmFtIHRyYW5zYWN0aW9uRGVzY3JpcHRvciBBIEJ1ZmZlciB0aGF0IGRlc2NyaWJlIHRoZSB0cmFuc2FjdGlvblxuICAgKi9cbiAgKGVycjogRXJyb3IgfCBudWxsIHwgdW5kZWZpbmVkLCB0cmFuc2FjdGlvbkRlc2NyaXB0b3I/OiBCdWZmZXIpID0+IHZvaWRcblxudHlwZSBTYXZlVHJhbnNhY3Rpb25DYWxsYmFjayA9XG4gIC8qKlxuICAgKiBUaGUgY2FsbGJhY2sgaXMgY2FsbGVkIHdoZW4gdGhlIHJlcXVlc3QgdG8gc2V0IGEgc2F2ZXBvaW50IHdpdGhpbiB0aGVcbiAgICogdHJhbnNhY3Rpb24gaGFzIGNvbXBsZXRlZCwgZWl0aGVyIHN1Y2Nlc3NmdWxseSBvciB3aXRoIGFuIGVycm9yLlxuICAgKiBJZiBhbiBlcnJvciBvY2N1cnJlZCB0aGVuIGBlcnJgIHdpbGwgZGVzY3JpYmUgdGhlIGVycm9yLlxuICAgKlxuICAgKiBBcyBvbmx5IG9uZSByZXF1ZXN0IGF0IGEgdGltZSBtYXkgYmUgZXhlY3V0ZWQgb24gYSBjb25uZWN0aW9uLCBhbm90aGVyIHJlcXVlc3Qgc2hvdWxkIG5vdFxuICAgKiBiZSBpbml0aWF0ZWQgdW50aWwgdGhpcyBjYWxsYmFjayBpcyBjYWxsZWQuXG4gICAqXG4gICAqIEBwYXJhbSBlcnIgSWYgYW4gZXJyb3Igb2NjdXJyZWQsIGFuIFtbRXJyb3JdXSBvYmplY3Qgd2l0aCBkZXRhaWxzIG9mIHRoZSBlcnJvci5cbiAgICovXG4gIChlcnI6IEVycm9yIHwgbnVsbCB8IHVuZGVmaW5lZCkgPT4gdm9pZDtcblxudHlwZSBDb21taXRUcmFuc2FjdGlvbkNhbGxiYWNrID1cbiAgLyoqXG4gICAqIFRoZSBjYWxsYmFjayBpcyBjYWxsZWQgd2hlbiB0aGUgcmVxdWVzdCB0byBjb21taXQgdGhlIHRyYW5zYWN0aW9uIGhhcyBjb21wbGV0ZWQsXG4gICAqIGVpdGhlciBzdWNjZXNzZnVsbHkgb3Igd2l0aCBhbiBlcnJvci5cbiAgICogSWYgYW4gZXJyb3Igb2NjdXJyZWQgdGhlbiBgZXJyYCB3aWxsIGRlc2NyaWJlIHRoZSBlcnJvci5cbiAgICpcbiAgICogQXMgb25seSBvbmUgcmVxdWVzdCBhdCBhIHRpbWUgbWF5IGJlIGV4ZWN1dGVkIG9uIGEgY29ubmVjdGlvbiwgYW5vdGhlciByZXF1ZXN0IHNob3VsZCBub3RcbiAgICogYmUgaW5pdGlhdGVkIHVudGlsIHRoaXMgY2FsbGJhY2sgaXMgY2FsbGVkLlxuICAgKlxuICAgKiBAcGFyYW0gZXJyIElmIGFuIGVycm9yIG9jY3VycmVkLCBhbiBbW0Vycm9yXV0gb2JqZWN0IHdpdGggZGV0YWlscyBvZiB0aGUgZXJyb3IuXG4gICAqL1xuICAoZXJyOiBFcnJvciB8IG51bGwgfCB1bmRlZmluZWQpID0+IHZvaWQ7XG5cbnR5cGUgUm9sbGJhY2tUcmFuc2FjdGlvbkNhbGxiYWNrID1cbiAgLyoqXG4gICAqIFRoZSBjYWxsYmFjayBpcyBjYWxsZWQgd2hlbiB0aGUgcmVxdWVzdCB0byByb2xsYmFjayB0aGUgdHJhbnNhY3Rpb24gaGFzXG4gICAqIGNvbXBsZXRlZCwgZWl0aGVyIHN1Y2Nlc3NmdWxseSBvciB3aXRoIGFuIGVycm9yLlxuICAgKiBJZiBhbiBlcnJvciBvY2N1cnJlZCB0aGVuIGVyciB3aWxsIGRlc2NyaWJlIHRoZSBlcnJvci5cbiAgICpcbiAgICogQXMgb25seSBvbmUgcmVxdWVzdCBhdCBhIHRpbWUgbWF5IGJlIGV4ZWN1dGVkIG9uIGEgY29ubmVjdGlvbiwgYW5vdGhlciByZXF1ZXN0IHNob3VsZCBub3RcbiAgICogYmUgaW5pdGlhdGVkIHVudGlsIHRoaXMgY2FsbGJhY2sgaXMgY2FsbGVkLlxuICAgKlxuICAgKiBAcGFyYW0gZXJyIElmIGFuIGVycm9yIG9jY3VycmVkLCBhbiBbW0Vycm9yXV0gb2JqZWN0IHdpdGggZGV0YWlscyBvZiB0aGUgZXJyb3IuXG4gICAqL1xuICAoZXJyOiBFcnJvciB8IG51bGwgfCB1bmRlZmluZWQpID0+IHZvaWQ7XG5cbnR5cGUgUmVzZXRDYWxsYmFjayA9XG4gIC8qKlxuICAgKiBUaGUgY2FsbGJhY2sgaXMgY2FsbGVkIHdoZW4gdGhlIGNvbm5lY3Rpb24gcmVzZXQgaGFzIGNvbXBsZXRlZCxcbiAgICogZWl0aGVyIHN1Y2Nlc3NmdWxseSBvciB3aXRoIGFuIGVycm9yLlxuICAgKlxuICAgKiBJZiBhbiBlcnJvciBvY2N1cnJlZCB0aGVuIGBlcnJgIHdpbGwgZGVzY3JpYmUgdGhlIGVycm9yLlxuICAgKlxuICAgKiBBcyBvbmx5IG9uZSByZXF1ZXN0IGF0IGEgdGltZSBtYXkgYmUgZXhlY3V0ZWQgb24gYSBjb25uZWN0aW9uLCBhbm90aGVyXG4gICAqIHJlcXVlc3Qgc2hvdWxkIG5vdCBiZSBpbml0aWF0ZWQgdW50aWwgdGhpcyBjYWxsYmFjayBpcyBjYWxsZWRcbiAgICpcbiAgICogQHBhcmFtIGVyciBJZiBhbiBlcnJvciBvY2N1cnJlZCwgYW4gW1tFcnJvcl1dIG9iamVjdCB3aXRoIGRldGFpbHMgb2YgdGhlIGVycm9yLlxuICAgKi9cbiAgKGVycjogRXJyb3IgfCBudWxsIHwgdW5kZWZpbmVkKSA9PiB2b2lkO1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVudXNlZC12YXJzXG50eXBlIFRyYW5zYWN0aW9uQ2FsbGJhY2s8VCBleHRlbmRzIChlcnI6IEVycm9yIHwgbnVsbCB8IHVuZGVmaW5lZCwgLi4uYXJnczogYW55W10pID0+IHZvaWQ+ID1cbiAgLyoqXG4gICAqIFRoZSBjYWxsYmFjayBpcyBjYWxsZWQgd2hlbiB0aGUgcmVxdWVzdCB0byBzdGFydCBhIHRyYW5zYWN0aW9uIChvciBjcmVhdGUgYSBzYXZlcG9pbnQsIGluXG4gICAqIHRoZSBjYXNlIG9mIGEgbmVzdGVkIHRyYW5zYWN0aW9uKSBoYXMgY29tcGxldGVkLCBlaXRoZXIgc3VjY2Vzc2Z1bGx5IG9yIHdpdGggYW4gZXJyb3IuXG4gICAqIElmIGFuIGVycm9yIG9jY3VycmVkLCB0aGVuIGBlcnJgIHdpbGwgZGVzY3JpYmUgdGhlIGVycm9yLlxuICAgKiBJZiBubyBlcnJvciBvY2N1cnJlZCwgdGhlIGNhbGxiYWNrIHNob3VsZCBwZXJmb3JtIGl0cyB3b3JrIGFuZCBldmVudHVhbGx5IGNhbGxcbiAgICogYGRvbmVgIHdpdGggYW4gZXJyb3Igb3IgbnVsbCAodG8gdHJpZ2dlciBhIHRyYW5zYWN0aW9uIHJvbGxiYWNrIG9yIGFcbiAgICogdHJhbnNhY3Rpb24gY29tbWl0KSBhbmQgYW4gYWRkaXRpb25hbCBjb21wbGV0aW9uIGNhbGxiYWNrIHRoYXQgd2lsbCBiZSBjYWxsZWQgd2hlbiB0aGUgcmVxdWVzdFxuICAgKiB0byByb2xsYmFjayBvciBjb21taXQgdGhlIGN1cnJlbnQgdHJhbnNhY3Rpb24gaGFzIGNvbXBsZXRlZCwgZWl0aGVyIHN1Y2Nlc3NmdWxseSBvciB3aXRoIGFuIGVycm9yLlxuICAgKiBBZGRpdGlvbmFsIGFyZ3VtZW50cyBnaXZlbiB0byBgZG9uZWAgd2lsbCBiZSBwYXNzZWQgdGhyb3VnaCB0byB0aGlzIGNhbGxiYWNrLlxuICAgKlxuICAgKiBBcyBvbmx5IG9uZSByZXF1ZXN0IGF0IGEgdGltZSBtYXkgYmUgZXhlY3V0ZWQgb24gYSBjb25uZWN0aW9uLCBhbm90aGVyIHJlcXVlc3Qgc2hvdWxkIG5vdFxuICAgKiBiZSBpbml0aWF0ZWQgdW50aWwgdGhlIGNvbXBsZXRpb24gY2FsbGJhY2sgaXMgY2FsbGVkLlxuICAgKlxuICAgKiBAcGFyYW0gZXJyIElmIGFuIGVycm9yIG9jY3VycmVkLCBhbiBbW0Vycm9yXV0gb2JqZWN0IHdpdGggZGV0YWlscyBvZiB0aGUgZXJyb3IuXG4gICAqIEBwYXJhbSB0eERvbmUgSWYgbm8gZXJyb3Igb2NjdXJyZWQsIGEgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHRvIGNvbW1pdCBvciByb2xsYmFjayB0aGUgdHJhbnNhY3Rpb24uXG4gICAqL1xuICAoZXJyOiBFcnJvciB8IG51bGwgfCB1bmRlZmluZWQsIHR4RG9uZT86IFRyYW5zYWN0aW9uRG9uZTxUPikgPT4gdm9pZDtcblxudHlwZSBUcmFuc2FjdGlvbkRvbmVDYWxsYmFjayA9IChlcnI6IEVycm9yIHwgbnVsbCB8IHVuZGVmaW5lZCwgLi4uYXJnczogYW55W10pID0+IHZvaWQ7XG50eXBlIENhbGxiYWNrUGFyYW1ldGVyczxUIGV4dGVuZHMgKGVycjogRXJyb3IgfCBudWxsIHwgdW5kZWZpbmVkLCAuLi5hcmdzOiBhbnlbXSkgPT4gYW55PiA9IFQgZXh0ZW5kcyAoZXJyOiBFcnJvciB8IG51bGwgfCB1bmRlZmluZWQsIC4uLmFyZ3M6IGluZmVyIFApID0+IGFueSA/IFAgOiBuZXZlcjtcblxudHlwZSBUcmFuc2FjdGlvbkRvbmU8VCBleHRlbmRzIChlcnI6IEVycm9yIHwgbnVsbCB8IHVuZGVmaW5lZCwgLi4uYXJnczogYW55W10pID0+IHZvaWQ+ID1cbiAgLyoqXG4gICAqIElmIG5vIGVycm9yIG9jY3VycmVkLCBhIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB0byBjb21taXQgb3Igcm9sbGJhY2sgdGhlIHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gZXJyIElmIGFuIGVyciBvY2N1cnJlZCwgYSBzdHJpbmcgd2l0aCBkZXRhaWxzIG9mIHRoZSBlcnJvci5cbiAgICovXG4gIChlcnI6IEVycm9yIHwgbnVsbCB8IHVuZGVmaW5lZCwgZG9uZTogVCwgLi4uYXJnczogQ2FsbGJhY2tQYXJhbWV0ZXJzPFQ+KSA9PiB2b2lkO1xuXG4vKipcbiAqIEBwcml2YXRlXG4gKi9cbmNvbnN0IEtFRVBfQUxJVkVfSU5JVElBTF9ERUxBWSA9IDMwICogMTAwMDtcbi8qKlxuICogQHByaXZhdGVcbiAqL1xuY29uc3QgREVGQVVMVF9DT05ORUNUX1RJTUVPVVQgPSAxNSAqIDEwMDA7XG4vKipcbiAqIEBwcml2YXRlXG4gKi9cbmNvbnN0IERFRkFVTFRfQ0xJRU5UX1JFUVVFU1RfVElNRU9VVCA9IDE1ICogMTAwMDtcbi8qKlxuICogQHByaXZhdGVcbiAqL1xuY29uc3QgREVGQVVMVF9DQU5DRUxfVElNRU9VVCA9IDUgKiAxMDAwO1xuLyoqXG4gKiBAcHJpdmF0ZVxuICovXG5jb25zdCBERUZBVUxUX0NPTk5FQ1RfUkVUUllfSU5URVJWQUwgPSA1MDA7XG4vKipcbiAqIEBwcml2YXRlXG4gKi9cbmNvbnN0IERFRkFVTFRfUEFDS0VUX1NJWkUgPSA0ICogMTAyNDtcbi8qKlxuICogQHByaXZhdGVcbiAqL1xuY29uc3QgREVGQVVMVF9URVhUU0laRSA9IDIxNDc0ODM2NDc7XG4vKipcbiAqIEBwcml2YXRlXG4gKi9cbmNvbnN0IERFRkFVTFRfREFURUZJUlNUID0gNztcbi8qKlxuICogQHByaXZhdGVcbiAqL1xuY29uc3QgREVGQVVMVF9QT1JUID0gMTQzMztcbi8qKlxuICogQHByaXZhdGVcbiAqL1xuY29uc3QgREVGQVVMVF9URFNfVkVSU0lPTiA9ICc3XzQnO1xuLyoqXG4gKiBAcHJpdmF0ZVxuICovXG5jb25zdCBERUZBVUxUX0xBTkdVQUdFID0gJ3VzX2VuZ2xpc2gnO1xuLyoqXG4gKiBAcHJpdmF0ZVxuICovXG5jb25zdCBERUZBVUxUX0RBVEVGT1JNQVQgPSAnbWR5JztcblxuaW50ZXJmYWNlIEF6dXJlQWN0aXZlRGlyZWN0b3J5TXNpQXBwU2VydmljZUF1dGhlbnRpY2F0aW9uIHtcbiAgdHlwZTogJ2F6dXJlLWFjdGl2ZS1kaXJlY3RvcnktbXNpLWFwcC1zZXJ2aWNlJztcbiAgb3B0aW9uczoge1xuICAgIC8qKlxuICAgICAqIElmIHlvdSB1c2VyIHdhbnQgdG8gY29ubmVjdCB0byBhbiBBenVyZSBhcHAgc2VydmljZSB1c2luZyBhIHNwZWNpZmljIGNsaWVudCBhY2NvdW50XG4gICAgICogdGhleSBuZWVkIHRvIHByb3ZpZGUgYGNsaWVudElkYCBhc3NvY2lhdGUgdG8gdGhlaXIgY3JlYXRlZCBpZGVudGl0eS5cbiAgICAgKlxuICAgICAqIFRoaXMgaXMgb3B0aW9uYWwgZm9yIHJldHJpZXZlIHRva2VuIGZyb20gYXp1cmUgd2ViIGFwcCBzZXJ2aWNlXG4gICAgICovXG4gICAgY2xpZW50SWQ/OiBzdHJpbmc7XG4gIH07XG59XG5cbmludGVyZmFjZSBBenVyZUFjdGl2ZURpcmVjdG9yeU1zaVZtQXV0aGVudGljYXRpb24ge1xuICB0eXBlOiAnYXp1cmUtYWN0aXZlLWRpcmVjdG9yeS1tc2ktdm0nO1xuICBvcHRpb25zOiB7XG4gICAgLyoqXG4gICAgICogSWYgeW91IHdhbnQgdG8gY29ubmVjdCB1c2luZyBhIHNwZWNpZmljIGNsaWVudCBhY2NvdW50XG4gICAgICogdGhleSBuZWVkIHRvIHByb3ZpZGUgYGNsaWVudElkYCBhc3NvY2lhdGVkIHRvIHRoZWlyIGNyZWF0ZWQgaWRlbnRpdHkuXG4gICAgICpcbiAgICAgKiBUaGlzIGlzIG9wdGlvbmFsIGZvciByZXRyaWV2ZSBhIHRva2VuXG4gICAgICovXG4gICAgY2xpZW50SWQ/OiBzdHJpbmc7XG4gIH07XG59XG5cbmludGVyZmFjZSBBenVyZUFjdGl2ZURpcmVjdG9yeURlZmF1bHRBdXRoZW50aWNhdGlvbiB7XG4gIHR5cGU6ICdhenVyZS1hY3RpdmUtZGlyZWN0b3J5LWRlZmF1bHQnO1xuICBvcHRpb25zOiB7XG4gICAgLyoqXG4gICAgICogSWYgeW91IHdhbnQgdG8gY29ubmVjdCB1c2luZyBhIHNwZWNpZmljIGNsaWVudCBhY2NvdW50XG4gICAgICogdGhleSBuZWVkIHRvIHByb3ZpZGUgYGNsaWVudElkYCBhc3NvY2lhdGVkIHRvIHRoZWlyIGNyZWF0ZWQgaWRlbnRpdHkuXG4gICAgICpcbiAgICAgKiBUaGlzIGlzIG9wdGlvbmFsIGZvciByZXRyaWV2aW5nIGEgdG9rZW5cbiAgICAgKi9cbiAgICBjbGllbnRJZD86IHN0cmluZztcbiAgfTtcbn1cblxuXG5pbnRlcmZhY2UgQXp1cmVBY3RpdmVEaXJlY3RvcnlBY2Nlc3NUb2tlbkF1dGhlbnRpY2F0aW9uIHtcbiAgdHlwZTogJ2F6dXJlLWFjdGl2ZS1kaXJlY3RvcnktYWNjZXNzLXRva2VuJztcbiAgb3B0aW9uczoge1xuICAgIC8qKlxuICAgICAqIEEgdXNlciBuZWVkIHRvIHByb3ZpZGUgYHRva2VuYCB3aGljaCB0aGV5IHJldHJpZXZlZCBlbHNlIHdoZXJlXG4gICAgICogdG8gZm9ybWluZyB0aGUgY29ubmVjdGlvbi5cbiAgICAgKi9cbiAgICB0b2tlbjogc3RyaW5nO1xuICB9O1xufVxuXG5pbnRlcmZhY2UgQXp1cmVBY3RpdmVEaXJlY3RvcnlQYXNzd29yZEF1dGhlbnRpY2F0aW9uIHtcbiAgdHlwZTogJ2F6dXJlLWFjdGl2ZS1kaXJlY3RvcnktcGFzc3dvcmQnO1xuICBvcHRpb25zOiB7XG4gICAgLyoqXG4gICAgICogQSB1c2VyIG5lZWQgdG8gcHJvdmlkZSBgdXNlck5hbWVgIGFzc29jaWF0ZSB0byB0aGVpciBhY2NvdW50LlxuICAgICAqL1xuICAgIHVzZXJOYW1lOiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBBIHVzZXIgbmVlZCB0byBwcm92aWRlIGBwYXNzd29yZGAgYXNzb2NpYXRlIHRvIHRoZWlyIGFjY291bnQuXG4gICAgICovXG4gICAgcGFzc3dvcmQ6IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIEEgY2xpZW50IGlkIHRvIHVzZS5cbiAgICAgKi9cbiAgICBjbGllbnRJZDogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogT3B0aW9uYWwgcGFyYW1ldGVyIGZvciBzcGVjaWZpYyBBenVyZSB0ZW5hbnQgSURcbiAgICAgKi9cbiAgICB0ZW5hbnRJZDogc3RyaW5nO1xuICB9O1xufVxuXG5pbnRlcmZhY2UgQXp1cmVBY3RpdmVEaXJlY3RvcnlTZXJ2aWNlUHJpbmNpcGFsU2VjcmV0IHtcbiAgdHlwZTogJ2F6dXJlLWFjdGl2ZS1kaXJlY3Rvcnktc2VydmljZS1wcmluY2lwYWwtc2VjcmV0JztcbiAgb3B0aW9uczoge1xuICAgIC8qKlxuICAgICAqIEFwcGxpY2F0aW9uIChgY2xpZW50YCkgSUQgZnJvbSB5b3VyIHJlZ2lzdGVyZWQgQXp1cmUgYXBwbGljYXRpb25cbiAgICAgKi9cbiAgICBjbGllbnRJZDogc3RyaW5nO1xuICAgIC8qKlxuICAgICAqIFRoZSBjcmVhdGVkIGBjbGllbnQgc2VjcmV0YCBmb3IgdGhpcyByZWdpc3RlcmVkIEF6dXJlIGFwcGxpY2F0aW9uXG4gICAgICovXG4gICAgY2xpZW50U2VjcmV0OiBzdHJpbmc7XG4gICAgLyoqXG4gICAgICogRGlyZWN0b3J5IChgdGVuYW50YCkgSUQgZnJvbSB5b3VyIHJlZ2lzdGVyZWQgQXp1cmUgYXBwbGljYXRpb25cbiAgICAgKi9cbiAgICB0ZW5hbnRJZDogc3RyaW5nO1xuICB9O1xufVxuXG5pbnRlcmZhY2UgTnRsbUF1dGhlbnRpY2F0aW9uIHtcbiAgdHlwZTogJ250bG0nO1xuICBvcHRpb25zOiB7XG4gICAgLyoqXG4gICAgICogVXNlciBuYW1lIGZyb20geW91ciB3aW5kb3dzIGFjY291bnQuXG4gICAgICovXG4gICAgdXNlck5hbWU6IHN0cmluZztcbiAgICAvKipcbiAgICAgKiBQYXNzd29yZCBmcm9tIHlvdXIgd2luZG93cyBhY2NvdW50LlxuICAgICAqL1xuICAgIHBhc3N3b3JkOiBzdHJpbmc7XG4gICAgLyoqXG4gICAgICogT25jZSB5b3Ugc2V0IGRvbWFpbiBmb3IgbnRsbSBhdXRoZW50aWNhdGlvbiB0eXBlLCBkcml2ZXIgd2lsbCBjb25uZWN0IHRvIFNRTCBTZXJ2ZXIgdXNpbmcgZG9tYWluIGxvZ2luLlxuICAgICAqXG4gICAgICogVGhpcyBpcyBuZWNlc3NhcnkgZm9yIGZvcm1pbmcgYSBjb25uZWN0aW9uIHVzaW5nIG50bG0gdHlwZVxuICAgICAqL1xuICAgIGRvbWFpbjogc3RyaW5nO1xuICB9O1xufVxuXG5pbnRlcmZhY2UgRGVmYXVsdEF1dGhlbnRpY2F0aW9uIHtcbiAgdHlwZTogJ2RlZmF1bHQnO1xuICBvcHRpb25zOiB7XG4gICAgLyoqXG4gICAgICogVXNlciBuYW1lIHRvIHVzZSBmb3Igc3FsIHNlcnZlciBsb2dpbi5cbiAgICAgKi9cbiAgICB1c2VyTmFtZT86IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAvKipcbiAgICAgKiBQYXNzd29yZCB0byB1c2UgZm9yIHNxbCBzZXJ2ZXIgbG9naW4uXG4gICAgICovXG4gICAgcGFzc3dvcmQ/OiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIH07XG59XG5cbmludGVyZmFjZSBFcnJvcldpdGhDb2RlIGV4dGVuZHMgRXJyb3Ige1xuICBjb2RlPzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgSW50ZXJuYWxDb25uZWN0aW9uQ29uZmlnIHtcbiAgc2VydmVyOiBzdHJpbmc7XG4gIGF1dGhlbnRpY2F0aW9uOiBEZWZhdWx0QXV0aGVudGljYXRpb24gfCBOdGxtQXV0aGVudGljYXRpb24gfCBBenVyZUFjdGl2ZURpcmVjdG9yeVBhc3N3b3JkQXV0aGVudGljYXRpb24gfCBBenVyZUFjdGl2ZURpcmVjdG9yeU1zaUFwcFNlcnZpY2VBdXRoZW50aWNhdGlvbiB8IEF6dXJlQWN0aXZlRGlyZWN0b3J5TXNpVm1BdXRoZW50aWNhdGlvbiB8IEF6dXJlQWN0aXZlRGlyZWN0b3J5QWNjZXNzVG9rZW5BdXRoZW50aWNhdGlvbiB8IEF6dXJlQWN0aXZlRGlyZWN0b3J5U2VydmljZVByaW5jaXBhbFNlY3JldCB8IEF6dXJlQWN0aXZlRGlyZWN0b3J5RGVmYXVsdEF1dGhlbnRpY2F0aW9uO1xuICBvcHRpb25zOiBJbnRlcm5hbENvbm5lY3Rpb25PcHRpb25zO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEludGVybmFsQ29ubmVjdGlvbk9wdGlvbnMge1xuICBhYm9ydFRyYW5zYWN0aW9uT25FcnJvcjogYm9vbGVhbjtcbiAgYXBwTmFtZTogdW5kZWZpbmVkIHwgc3RyaW5nO1xuICBjYW1lbENhc2VDb2x1bW5zOiBib29sZWFuO1xuICBjYW5jZWxUaW1lb3V0OiBudW1iZXI7XG4gIGNvbHVtbkVuY3J5cHRpb25LZXlDYWNoZVRUTDogbnVtYmVyO1xuICBjb2x1bW5FbmNyeXB0aW9uU2V0dGluZzogYm9vbGVhbjtcbiAgY29sdW1uTmFtZVJlcGxhY2VyOiB1bmRlZmluZWQgfCAoKGNvbE5hbWU6IHN0cmluZywgaW5kZXg6IG51bWJlciwgbWV0YWRhdGE6IE1ldGFkYXRhKSA9PiBzdHJpbmcpO1xuICBjb25uZWN0aW9uUmV0cnlJbnRlcnZhbDogbnVtYmVyO1xuICBjb25uZWN0b3I6IHVuZGVmaW5lZCB8ICgoKSA9PiBQcm9taXNlPG5ldC5Tb2NrZXQ+KTtcbiAgY29ubmVjdFRpbWVvdXQ6IG51bWJlcjtcbiAgY29ubmVjdGlvbklzb2xhdGlvbkxldmVsOiB0eXBlb2YgSVNPTEFUSU9OX0xFVkVMW2tleW9mIHR5cGVvZiBJU09MQVRJT05fTEVWRUxdO1xuICBjcnlwdG9DcmVkZW50aWFsc0RldGFpbHM6IFNlY3VyZUNvbnRleHRPcHRpb25zO1xuICBkYXRhYmFzZTogdW5kZWZpbmVkIHwgc3RyaW5nO1xuICBkYXRlZmlyc3Q6IG51bWJlcjtcbiAgZGF0ZUZvcm1hdDogc3RyaW5nO1xuICBkZWJ1Zzoge1xuICAgIGRhdGE6IGJvb2xlYW47XG4gICAgcGFja2V0OiBib29sZWFuO1xuICAgIHBheWxvYWQ6IGJvb2xlYW47XG4gICAgdG9rZW46IGJvb2xlYW47XG4gIH07XG4gIGVuYWJsZUFuc2lOdWxsOiBudWxsIHwgYm9vbGVhbjtcbiAgZW5hYmxlQW5zaU51bGxEZWZhdWx0OiBudWxsIHwgYm9vbGVhbjtcbiAgZW5hYmxlQW5zaVBhZGRpbmc6IG51bGwgfCBib29sZWFuO1xuICBlbmFibGVBbnNpV2FybmluZ3M6IG51bGwgfCBib29sZWFuO1xuICBlbmFibGVBcml0aEFib3J0OiBudWxsIHwgYm9vbGVhbjtcbiAgZW5hYmxlQ29uY2F0TnVsbFlpZWxkc051bGw6IG51bGwgfCBib29sZWFuO1xuICBlbmFibGVDdXJzb3JDbG9zZU9uQ29tbWl0OiBudWxsIHwgYm9vbGVhbjtcbiAgZW5hYmxlSW1wbGljaXRUcmFuc2FjdGlvbnM6IG51bGwgfCBib29sZWFuO1xuICBlbmFibGVOdW1lcmljUm91bmRhYm9ydDogbnVsbCB8IGJvb2xlYW47XG4gIGVuYWJsZVF1b3RlZElkZW50aWZpZXI6IG51bGwgfCBib29sZWFuO1xuICBlbmNyeXB0OiBzdHJpbmcgfCBib29sZWFuO1xuICBlbmNyeXB0aW9uS2V5U3RvcmVQcm92aWRlcnM6IEtleVN0b3JlUHJvdmlkZXJNYXAgfCB1bmRlZmluZWQ7XG4gIGZhbGxiYWNrVG9EZWZhdWx0RGI6IGJvb2xlYW47XG4gIGluc3RhbmNlTmFtZTogdW5kZWZpbmVkIHwgc3RyaW5nO1xuICBpc29sYXRpb25MZXZlbDogdHlwZW9mIElTT0xBVElPTl9MRVZFTFtrZXlvZiB0eXBlb2YgSVNPTEFUSU9OX0xFVkVMXTtcbiAgbGFuZ3VhZ2U6IHN0cmluZztcbiAgbG9jYWxBZGRyZXNzOiB1bmRlZmluZWQgfCBzdHJpbmc7XG4gIG1heFJldHJpZXNPblRyYW5zaWVudEVycm9yczogbnVtYmVyO1xuICBtdWx0aVN1Ym5ldEZhaWxvdmVyOiBib29sZWFuO1xuICBwYWNrZXRTaXplOiBudW1iZXI7XG4gIHBvcnQ6IHVuZGVmaW5lZCB8IG51bWJlcjtcbiAgcmVhZE9ubHlJbnRlbnQ6IGJvb2xlYW47XG4gIHJlcXVlc3RUaW1lb3V0OiBudW1iZXI7XG4gIHJvd0NvbGxlY3Rpb25PbkRvbmU6IGJvb2xlYW47XG4gIHJvd0NvbGxlY3Rpb25PblJlcXVlc3RDb21wbGV0aW9uOiBib29sZWFuO1xuICBzZXJ2ZXJOYW1lOiB1bmRlZmluZWQgfCBzdHJpbmc7XG4gIHNlcnZlclN1cHBvcnRzQ29sdW1uRW5jcnlwdGlvbjogYm9vbGVhbjtcbiAgdGRzVmVyc2lvbjogc3RyaW5nO1xuICB0ZXh0c2l6ZTogbnVtYmVyO1xuICB0cnVzdGVkU2VydmVyTmFtZUFFOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIHRydXN0U2VydmVyQ2VydGlmaWNhdGU6IGJvb2xlYW47XG4gIHVzZUNvbHVtbk5hbWVzOiBib29sZWFuO1xuICB1c2VVVEM6IGJvb2xlYW47XG4gIHdvcmtzdGF0aW9uSWQ6IHVuZGVmaW5lZCB8IHN0cmluZztcbiAgbG93ZXJDYXNlR3VpZHM6IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBLZXlTdG9yZVByb3ZpZGVyTWFwIHtcbiAgW2tleTogc3RyaW5nXTogQ29sdW1uRW5jcnlwdGlvbkF6dXJlS2V5VmF1bHRQcm92aWRlcjtcbn1cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICovXG5pbnRlcmZhY2UgU3RhdGUge1xuICBuYW1lOiBzdHJpbmc7XG4gIGVudGVyPyh0aGlzOiBDb25uZWN0aW9uKTogdm9pZDtcbiAgZXhpdD8odGhpczogQ29ubmVjdGlvbiwgbmV3U3RhdGU6IFN0YXRlKTogdm9pZDtcbiAgZXZlbnRzOiB7XG4gICAgc29ja2V0RXJyb3I/KHRoaXM6IENvbm5lY3Rpb24sIGVycjogRXJyb3IpOiB2b2lkO1xuICAgIGNvbm5lY3RUaW1lb3V0Pyh0aGlzOiBDb25uZWN0aW9uKTogdm9pZDtcbiAgICBtZXNzYWdlPyh0aGlzOiBDb25uZWN0aW9uLCBtZXNzYWdlOiBNZXNzYWdlKTogdm9pZDtcbiAgICByZXRyeT8odGhpczogQ29ubmVjdGlvbik6IHZvaWQ7XG4gICAgcmVjb25uZWN0Pyh0aGlzOiBDb25uZWN0aW9uKTogdm9pZDtcbiAgfTtcbn1cblxudHlwZSBBdXRoZW50aWNhdGlvbiA9IERlZmF1bHRBdXRoZW50aWNhdGlvbiB8XG4gIE50bG1BdXRoZW50aWNhdGlvbiB8XG4gIEF6dXJlQWN0aXZlRGlyZWN0b3J5UGFzc3dvcmRBdXRoZW50aWNhdGlvbiB8XG4gIEF6dXJlQWN0aXZlRGlyZWN0b3J5TXNpQXBwU2VydmljZUF1dGhlbnRpY2F0aW9uIHxcbiAgQXp1cmVBY3RpdmVEaXJlY3RvcnlNc2lWbUF1dGhlbnRpY2F0aW9uIHxcbiAgQXp1cmVBY3RpdmVEaXJlY3RvcnlBY2Nlc3NUb2tlbkF1dGhlbnRpY2F0aW9uIHxcbiAgQXp1cmVBY3RpdmVEaXJlY3RvcnlTZXJ2aWNlUHJpbmNpcGFsU2VjcmV0IHxcbiAgQXp1cmVBY3RpdmVEaXJlY3RvcnlEZWZhdWx0QXV0aGVudGljYXRpb247XG5cbnR5cGUgQXV0aGVudGljYXRpb25UeXBlID0gQXV0aGVudGljYXRpb25bJ3R5cGUnXTtcblxuZXhwb3J0IGludGVyZmFjZSBDb25uZWN0aW9uQ29uZmlndXJhdGlvbiB7XG4gIC8qKlxuICAgKiBIb3N0bmFtZSB0byBjb25uZWN0IHRvLlxuICAgKi9cbiAgc2VydmVyOiBzdHJpbmc7XG4gIC8qKlxuICAgKiBDb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIGZvcm1pbmcgdGhlIGNvbm5lY3Rpb24uXG4gICAqL1xuICBvcHRpb25zPzogQ29ubmVjdGlvbk9wdGlvbnM7XG4gIC8qKlxuICAgKiBBdXRoZW50aWNhdGlvbiByZWxhdGVkIG9wdGlvbnMgZm9yIGNvbm5lY3Rpb24uXG4gICAqL1xuICBhdXRoZW50aWNhdGlvbj86IEF1dGhlbnRpY2F0aW9uT3B0aW9ucztcbn1cblxuaW50ZXJmYWNlIERlYnVnT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBBIGJvb2xlYW4sIGNvbnRyb2xsaW5nIHdoZXRoZXIgW1tkZWJ1Z11dIGV2ZW50cyB3aWxsIGJlIGVtaXR0ZWQgd2l0aCB0ZXh0IGRlc2NyaWJpbmcgcGFja2V0IGRhdGEgZGV0YWlsc1xuICAgKlxuICAgKiAoZGVmYXVsdDogYGZhbHNlYClcbiAgICovXG4gIGRhdGE6IGJvb2xlYW47XG4gIC8qKlxuICAgKiBBIGJvb2xlYW4sIGNvbnRyb2xsaW5nIHdoZXRoZXIgW1tkZWJ1Z11dIGV2ZW50cyB3aWxsIGJlIGVtaXR0ZWQgd2l0aCB0ZXh0IGRlc2NyaWJpbmcgcGFja2V0IGRldGFpbHNcbiAgICpcbiAgICogKGRlZmF1bHQ6IGBmYWxzZWApXG4gICAqL1xuICBwYWNrZXQ6IGJvb2xlYW47XG4gIC8qKlxuICAgKiBBIGJvb2xlYW4sIGNvbnRyb2xsaW5nIHdoZXRoZXIgW1tkZWJ1Z11dIGV2ZW50cyB3aWxsIGJlIGVtaXR0ZWQgd2l0aCB0ZXh0IGRlc2NyaWJpbmcgcGFja2V0IHBheWxvYWQgZGV0YWlsc1xuICAgKlxuICAgKiAoZGVmYXVsdDogYGZhbHNlYClcbiAgICovXG4gIHBheWxvYWQ6IGJvb2xlYW47XG4gIC8qKlxuICAgKiBBIGJvb2xlYW4sIGNvbnRyb2xsaW5nIHdoZXRoZXIgW1tkZWJ1Z11dIGV2ZW50cyB3aWxsIGJlIGVtaXR0ZWQgd2l0aCB0ZXh0IGRlc2NyaWJpbmcgdG9rZW4gc3RyZWFtIHRva2Vuc1xuICAgKlxuICAgKiAoZGVmYXVsdDogYGZhbHNlYClcbiAgICovXG4gIHRva2VuOiBib29sZWFuO1xufVxuXG5pbnRlcmZhY2UgQXV0aGVudGljYXRpb25PcHRpb25zIHtcbiAgLyoqXG4gICAqIFR5cGUgb2YgdGhlIGF1dGhlbnRpY2F0aW9uIG1ldGhvZCwgdmFsaWQgdHlwZXMgYXJlIGBkZWZhdWx0YCwgYG50bG1gLFxuICAgKiBgYXp1cmUtYWN0aXZlLWRpcmVjdG9yeS1wYXNzd29yZGAsIGBhenVyZS1hY3RpdmUtZGlyZWN0b3J5LWFjY2Vzcy10b2tlbmAsXG4gICAqIGBhenVyZS1hY3RpdmUtZGlyZWN0b3J5LW1zaS12bWAsIGBhenVyZS1hY3RpdmUtZGlyZWN0b3J5LW1zaS1hcHAtc2VydmljZWAsXG4gICAqIGBhenVyZS1hY3RpdmUtZGlyZWN0b3J5LWRlZmF1bHRgXG4gICAqIG9yIGBhenVyZS1hY3RpdmUtZGlyZWN0b3J5LXNlcnZpY2UtcHJpbmNpcGFsLXNlY3JldGBcbiAgICovXG4gIHR5cGU/OiBBdXRoZW50aWNhdGlvblR5cGU7XG4gIC8qKlxuICAgKiBEaWZmZXJlbnQgb3B0aW9ucyBmb3IgYXV0aGVudGljYXRpb24gdHlwZXM6XG4gICAqXG4gICAqICogYGRlZmF1bHRgOiBbW0RlZmF1bHRBdXRoZW50aWNhdGlvbi5vcHRpb25zXV1cbiAgICogKiBgbnRsbWAgOltbTnRsbUF1dGhlbnRpY2F0aW9uXV1cbiAgICogKiBgYXp1cmUtYWN0aXZlLWRpcmVjdG9yeS1wYXNzd29yZGAgOiBbW0F6dXJlQWN0aXZlRGlyZWN0b3J5UGFzc3dvcmRBdXRoZW50aWNhdGlvbi5vcHRpb25zXV1cbiAgICogKiBgYXp1cmUtYWN0aXZlLWRpcmVjdG9yeS1hY2Nlc3MtdG9rZW5gIDogW1tBenVyZUFjdGl2ZURpcmVjdG9yeUFjY2Vzc1Rva2VuQXV0aGVudGljYXRpb24ub3B0aW9uc11dXG4gICAqICogYGF6dXJlLWFjdGl2ZS1kaXJlY3RvcnktbXNpLXZtYCA6IFtbQXp1cmVBY3RpdmVEaXJlY3RvcnlNc2lWbUF1dGhlbnRpY2F0aW9uLm9wdGlvbnNdXVxuICAgKiAqIGBhenVyZS1hY3RpdmUtZGlyZWN0b3J5LW1zaS1hcHAtc2VydmljZWAgOiBbW0F6dXJlQWN0aXZlRGlyZWN0b3J5TXNpQXBwU2VydmljZUF1dGhlbnRpY2F0aW9uLm9wdGlvbnNdXVxuICAgKiAqIGBhenVyZS1hY3RpdmUtZGlyZWN0b3J5LXNlcnZpY2UtcHJpbmNpcGFsLXNlY3JldGAgOiBbW0F6dXJlQWN0aXZlRGlyZWN0b3J5U2VydmljZVByaW5jaXBhbFNlY3JldC5vcHRpb25zXV1cbiAgICogKiBgYXp1cmUtYWN0aXZlLWRpcmVjdG9yeS1kZWZhdWx0YCA6IFtbQXp1cmVBY3RpdmVEaXJlY3RvcnlEZWZhdWx0QXV0aGVudGljYXRpb24ub3B0aW9uc11dXG4gICAqL1xuICBvcHRpb25zPzogYW55O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbm5lY3Rpb25PcHRpb25zIHtcbiAgLyoqXG4gICAqIEEgYm9vbGVhbiBkZXRlcm1pbmluZyB3aGV0aGVyIHRvIHJvbGxiYWNrIGEgdHJhbnNhY3Rpb24gYXV0b21hdGljYWxseSBpZiBhbnkgZXJyb3IgaXMgZW5jb3VudGVyZWRcbiAgICogZHVyaW5nIHRoZSBnaXZlbiB0cmFuc2FjdGlvbidzIGV4ZWN1dGlvbi4gVGhpcyBzZXRzIHRoZSB2YWx1ZSBmb3IgYFNFVCBYQUNUX0FCT1JUYCBkdXJpbmcgdGhlXG4gICAqIGluaXRpYWwgU1FMIHBoYXNlIG9mIGEgY29ubmVjdGlvbiBbZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9kb2NzLm1pY3Jvc29mdC5jb20vZW4tdXMvc3FsL3Qtc3FsL3N0YXRlbWVudHMvc2V0LXhhY3QtYWJvcnQtdHJhbnNhY3Qtc3FsKS5cbiAgICovXG4gIGFib3J0VHJhbnNhY3Rpb25PbkVycm9yPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogQXBwbGljYXRpb24gbmFtZSB1c2VkIGZvciBpZGVudGlmeWluZyBhIHNwZWNpZmljIGFwcGxpY2F0aW9uIGluIHByb2ZpbGluZywgbG9nZ2luZyBvciB0cmFjaW5nIHRvb2xzIG9mIFNRTFNlcnZlci5cbiAgICpcbiAgICogKGRlZmF1bHQ6IGBUZWRpb3VzYClcbiAgICovXG4gIGFwcE5hbWU/OiBzdHJpbmcgfCB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIEEgYm9vbGVhbiwgY29udHJvbGxpbmcgd2hldGhlciB0aGUgY29sdW1uIG5hbWVzIHJldHVybmVkIHdpbGwgaGF2ZSB0aGUgZmlyc3QgbGV0dGVyIGNvbnZlcnRlZCB0byBsb3dlciBjYXNlXG4gICAqIChgdHJ1ZWApIG9yIG5vdC4gVGhpcyB2YWx1ZSBpcyBpZ25vcmVkIGlmIHlvdSBwcm92aWRlIGEgW1tjb2x1bW5OYW1lUmVwbGFjZXJdXS5cbiAgICpcbiAgICogKGRlZmF1bHQ6IGBmYWxzZWApLlxuICAgKi9cbiAgY2FtZWxDYXNlQ29sdW1ucz86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGJlZm9yZSB0aGUgW1tSZXF1ZXN0LmNhbmNlbF1dIChhYm9ydCkgb2YgYSByZXF1ZXN0IGlzIGNvbnNpZGVyZWQgZmFpbGVkXG4gICAqXG4gICAqIChkZWZhdWx0OiBgNTAwMGApLlxuICAgKi9cbiAgY2FuY2VsVGltZW91dD86IG51bWJlcjtcblxuICAvKipcbiAgICogQSBmdW5jdGlvbiB3aXRoIHBhcmFtZXRlcnMgYChjb2x1bW5OYW1lLCBpbmRleCwgY29sdW1uTWV0YURhdGEpYCBhbmQgcmV0dXJuaW5nIGEgc3RyaW5nLiBJZiBwcm92aWRlZCxcbiAgICogdGhpcyB3aWxsIGJlIGNhbGxlZCBvbmNlIHBlciBjb2x1bW4gcGVyIHJlc3VsdC1zZXQuIFRoZSByZXR1cm5lZCB2YWx1ZSB3aWxsIGJlIHVzZWQgaW5zdGVhZCBvZiB0aGUgU1FMLXByb3ZpZGVkXG4gICAqIGNvbHVtbiBuYW1lIG9uIHJvdyBhbmQgbWV0YSBkYXRhIG9iamVjdHMuIFRoaXMgYWxsb3dzIHlvdSB0byBkeW5hbWljYWxseSBjb252ZXJ0IGJldHdlZW4gbmFtaW5nIGNvbnZlbnRpb25zLlxuICAgKlxuICAgKiAoZGVmYXVsdDogYG51bGxgKVxuICAgKi9cbiAgY29sdW1uTmFtZVJlcGxhY2VyPzogKGNvbE5hbWU6IHN0cmluZywgaW5kZXg6IG51bWJlciwgbWV0YWRhdGE6IE1ldGFkYXRhKSA9PiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIE51bWJlciBvZiBtaWxsaXNlY29uZHMgYmVmb3JlIHJldHJ5aW5nIHRvIGVzdGFibGlzaCBjb25uZWN0aW9uLCBpbiBjYXNlIG9mIHRyYW5zaWVudCBmYWlsdXJlLlxuICAgKlxuICAgKiAoZGVmYXVsdDpgNTAwYClcbiAgICovXG4gIGNvbm5lY3Rpb25SZXRyeUludGVydmFsPzogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBDdXN0b20gY29ubmVjdG9yIGZhY3RvcnkgbWV0aG9kLlxuICAgKlxuICAgKiAoZGVmYXVsdDogYHVuZGVmaW5lZGApXG4gICAqL1xuICBjb25uZWN0b3I/OiAoKSA9PiBQcm9taXNlPG5ldC5Tb2NrZXQ+O1xuXG4gIC8qKlxuICAgKiBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyBiZWZvcmUgdGhlIGF0dGVtcHQgdG8gY29ubmVjdCBpcyBjb25zaWRlcmVkIGZhaWxlZFxuICAgKlxuICAgKiAoZGVmYXVsdDogYDE1MDAwYCkuXG4gICAqL1xuICBjb25uZWN0VGltZW91dD86IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGRlZmF1bHQgaXNvbGF0aW9uIGxldmVsIGZvciBuZXcgY29ubmVjdGlvbnMuIEFsbCBvdXQtb2YtdHJhbnNhY3Rpb24gcXVlcmllcyBhcmUgZXhlY3V0ZWQgd2l0aCB0aGlzIHNldHRpbmcuXG4gICAqXG4gICAqIFRoZSBpc29sYXRpb24gbGV2ZWxzIGFyZSBhdmFpbGFibGUgZnJvbSBgcmVxdWlyZSgndGVkaW91cycpLklTT0xBVElPTl9MRVZFTGAuXG4gICAqICogYFJFQURfVU5DT01NSVRURURgXG4gICAqICogYFJFQURfQ09NTUlUVEVEYFxuICAgKiAqIGBSRVBFQVRBQkxFX1JFQURgXG4gICAqICogYFNFUklBTElaQUJMRWBcbiAgICogKiBgU05BUFNIT1RgXG4gICAqXG4gICAqIChkZWZhdWx0OiBgUkVBRF9DT01NSVRFRGApLlxuICAgKi9cbiAgY29ubmVjdGlvbklzb2xhdGlvbkxldmVsPzogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBXaGVuIGVuY3J5cHRpb24gaXMgdXNlZCwgYW4gb2JqZWN0IG1heSBiZSBzdXBwbGllZCB0aGF0IHdpbGwgYmUgdXNlZFxuICAgKiBmb3IgdGhlIGZpcnN0IGFyZ3VtZW50IHdoZW4gY2FsbGluZyBbYHRscy5jcmVhdGVTZWN1cmVQYWlyYF0oaHR0cDovL25vZGVqcy5vcmcvZG9jcy9sYXRlc3QvYXBpL3Rscy5odG1sI3Rsc190bHNfY3JlYXRlc2VjdXJlcGFpcl9jcmVkZW50aWFsc19pc3NlcnZlcl9yZXF1ZXN0Y2VydF9yZWplY3R1bmF1dGhvcml6ZWQpXG4gICAqXG4gICAqIChkZWZhdWx0OiBge31gKVxuICAgKi9cbiAgY3J5cHRvQ3JlZGVudGlhbHNEZXRhaWxzPzogU2VjdXJlQ29udGV4dE9wdGlvbnM7XG5cbiAgLyoqXG4gICAqIERhdGFiYXNlIHRvIGNvbm5lY3QgdG8gKGRlZmF1bHQ6IGRlcGVuZGVudCBvbiBzZXJ2ZXIgY29uZmlndXJhdGlvbikuXG4gICAqL1xuICBkYXRhYmFzZT86IHN0cmluZyB8IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogU2V0cyB0aGUgZmlyc3QgZGF5IG9mIHRoZSB3ZWVrIHRvIGEgbnVtYmVyIGZyb20gMSB0aHJvdWdoIDcuXG4gICAqL1xuICBkYXRlZmlyc3Q/OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEEgc3RyaW5nIHJlcHJlc2VudGluZyBwb3NpdGlvbiBvZiBtb250aCwgZGF5IGFuZCB5ZWFyIGluIHRlbXBvcmFsIGRhdGF0eXBlcy5cbiAgICpcbiAgICogKGRlZmF1bHQ6IGBtZHlgKVxuICAgKi9cbiAgZGF0ZUZvcm1hdD86IHN0cmluZztcblxuICBkZWJ1Zz86IERlYnVnT3B0aW9ucztcblxuICAvKipcbiAgICogQSBib29sZWFuLCBjb250cm9scyB0aGUgd2F5IG51bGwgdmFsdWVzIHNob3VsZCBiZSB1c2VkIGR1cmluZyBjb21wYXJpc29uIG9wZXJhdGlvbi5cbiAgICpcbiAgICogKGRlZmF1bHQ6IGB0cnVlYClcbiAgICovXG4gIGVuYWJsZUFuc2lOdWxsPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogSWYgdHJ1ZSwgYFNFVCBBTlNJX05VTExfREZMVF9PTiBPTmAgd2lsbCBiZSBzZXQgaW4gdGhlIGluaXRpYWwgc3FsLiBUaGlzIG1lYW5zIG5ldyBjb2x1bW5zIHdpbGwgYmVcbiAgICogbnVsbGFibGUgYnkgZGVmYXVsdC4gU2VlIHRoZSBbVC1TUUwgZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9tczE4NzM3NS5hc3B4KVxuICAgKlxuICAgKiAoZGVmYXVsdDogYHRydWVgKS5cbiAgICovXG4gIGVuYWJsZUFuc2lOdWxsRGVmYXVsdD86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEEgYm9vbGVhbiwgY29udHJvbHMgaWYgcGFkZGluZyBzaG91bGQgYmUgYXBwbGllZCBmb3IgdmFsdWVzIHNob3J0ZXIgdGhhbiB0aGUgc2l6ZSBvZiBkZWZpbmVkIGNvbHVtbi5cbiAgICpcbiAgICogKGRlZmF1bHQ6IGB0cnVlYClcbiAgICovXG4gIGVuYWJsZUFuc2lQYWRkaW5nPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogSWYgdHJ1ZSwgU1FMIFNlcnZlciB3aWxsIGZvbGxvdyBJU08gc3RhbmRhcmQgYmVoYXZpb3IgZHVyaW5nIHZhcmlvdXMgZXJyb3IgY29uZGl0aW9ucy4gRm9yIGRldGFpbHMsXG4gICAqIHNlZSBbZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9kb2NzLm1pY3Jvc29mdC5jb20vZW4tdXMvc3FsL3Qtc3FsL3N0YXRlbWVudHMvc2V0LWFuc2ktd2FybmluZ3MtdHJhbnNhY3Qtc3FsKVxuICAgKlxuICAgKiAoZGVmYXVsdDogYHRydWVgKVxuICAgKi9cbiAgZW5hYmxlQW5zaVdhcm5pbmdzPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogRW5kcyBhIHF1ZXJ5IHdoZW4gYW4gb3ZlcmZsb3cgb3IgZGl2aWRlLWJ5LXplcm8gZXJyb3Igb2NjdXJzIGR1cmluZyBxdWVyeSBleGVjdXRpb24uXG4gICAqIFNlZSBbZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9kb2NzLm1pY3Jvc29mdC5jb20vZW4tdXMvc3FsL3Qtc3FsL3N0YXRlbWVudHMvc2V0LWFyaXRoYWJvcnQtdHJhbnNhY3Qtc3FsP3ZpZXc9c3FsLXNlcnZlci0yMDE3KVxuICAgKiBmb3IgbW9yZSBkZXRhaWxzLlxuICAgKlxuICAgKiAoZGVmYXVsdDogYHRydWVgKVxuICAgKi9cbiAgZW5hYmxlQXJpdGhBYm9ydD86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEEgYm9vbGVhbiwgZGV0ZXJtaW5lcyBpZiBjb25jYXRlbmF0aW9uIHdpdGggTlVMTCBzaG91bGQgcmVzdWx0IGluIE5VTEwgb3IgZW1wdHkgc3RyaW5nIHZhbHVlLCBtb3JlIGRldGFpbHMgaW5cbiAgICogW2RvY3VtZW50YXRpb25dKGh0dHBzOi8vZG9jcy5taWNyb3NvZnQuY29tL2VuLXVzL3NxbC90LXNxbC9zdGF0ZW1lbnRzL3NldC1jb25jYXQtbnVsbC15aWVsZHMtbnVsbC10cmFuc2FjdC1zcWwpXG4gICAqXG4gICAqIChkZWZhdWx0OiBgdHJ1ZWApXG4gICAqL1xuICBlbmFibGVDb25jYXROdWxsWWllbGRzTnVsbD86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEEgYm9vbGVhbiwgY29udHJvbHMgd2hldGhlciBjdXJzb3Igc2hvdWxkIGJlIGNsb3NlZCwgaWYgdGhlIHRyYW5zYWN0aW9uIG9wZW5pbmcgaXQgZ2V0cyBjb21taXR0ZWQgb3Igcm9sbGVkXG4gICAqIGJhY2suXG4gICAqXG4gICAqIChkZWZhdWx0OiBgbnVsbGApXG4gICAqL1xuICBlbmFibGVDdXJzb3JDbG9zZU9uQ29tbWl0PzogYm9vbGVhbiB8IG51bGw7XG5cbiAgLyoqXG4gICAqIEEgYm9vbGVhbiwgc2V0cyB0aGUgY29ubmVjdGlvbiB0byBlaXRoZXIgaW1wbGljaXQgb3IgYXV0b2NvbW1pdCB0cmFuc2FjdGlvbiBtb2RlLlxuICAgKlxuICAgKiAoZGVmYXVsdDogYGZhbHNlYClcbiAgICovXG4gIGVuYWJsZUltcGxpY2l0VHJhbnNhY3Rpb25zPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogSWYgZmFsc2UsIGVycm9yIGlzIG5vdCBnZW5lcmF0ZWQgZHVyaW5nIGxvc3Mgb2YgcHJlY2Vzc2lvbi5cbiAgICpcbiAgICogKGRlZmF1bHQ6IGBmYWxzZWApXG4gICAqL1xuICBlbmFibGVOdW1lcmljUm91bmRhYm9ydD86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIElmIHRydWUsIGNoYXJhY3RlcnMgZW5jbG9zZWQgaW4gc2luZ2xlIHF1b3RlcyBhcmUgdHJlYXRlZCBhcyBsaXRlcmFscyBhbmQgdGhvc2UgZW5jbG9zZWQgZG91YmxlIHF1b3RlcyBhcmUgdHJlYXRlZCBhcyBpZGVudGlmaWVycy5cbiAgICpcbiAgICogKGRlZmF1bHQ6IGB0cnVlYClcbiAgICovXG4gIGVuYWJsZVF1b3RlZElkZW50aWZpZXI/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBBIHN0cmluZyB2YWx1ZSB0aGF0IGNhbiBiZSBvbmx5IHNldCB0byAnc3RyaWN0Jywgd2hpY2ggaW5kaWNhdGVzIHRoZSB1c2FnZSBURFMgOC4wIHByb3RvY29sLiBPdGhlcndpc2UsXG4gICAqIGEgYm9vbGVhbiBkZXRlcm1pbmluZyB3aGV0aGVyIG9yIG5vdCB0aGUgY29ubmVjdGlvbiB3aWxsIGJlIGVuY3J5cHRlZC5cbiAgICpcbiAgICogKGRlZmF1bHQ6IGB0cnVlYClcbiAgICovXG4gIGVuY3J5cHQ/OiBzdHJpbmcgfCBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBCeSBkZWZhdWx0LCBpZiB0aGUgZGF0YWJhc2UgcmVxdWVzdGVkIGJ5IFtbZGF0YWJhc2VdXSBjYW5ub3QgYmUgYWNjZXNzZWQsXG4gICAqIHRoZSBjb25uZWN0aW9uIHdpbGwgZmFpbCB3aXRoIGFuIGVycm9yLiBIb3dldmVyLCBpZiBbW2ZhbGxiYWNrVG9EZWZhdWx0RGJdXSBpc1xuICAgKiBzZXQgdG8gYHRydWVgLCB0aGVuIHRoZSB1c2VyJ3MgZGVmYXVsdCBkYXRhYmFzZSB3aWxsIGJlIHVzZWQgaW5zdGVhZFxuICAgKlxuICAgKiAoZGVmYXVsdDogYGZhbHNlYClcbiAgICovXG4gIGZhbGxiYWNrVG9EZWZhdWx0RGI/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBUaGUgaW5zdGFuY2UgbmFtZSB0byBjb25uZWN0IHRvLlxuICAgKiBUaGUgU1FMIFNlcnZlciBCcm93c2VyIHNlcnZpY2UgbXVzdCBiZSBydW5uaW5nIG9uIHRoZSBkYXRhYmFzZSBzZXJ2ZXIsXG4gICAqIGFuZCBVRFAgcG9ydCAxNDM0IG9uIHRoZSBkYXRhYmFzZSBzZXJ2ZXIgbXVzdCBiZSByZWFjaGFibGUuXG4gICAqXG4gICAqIChubyBkZWZhdWx0KVxuICAgKlxuICAgKiBNdXR1YWxseSBleGNsdXNpdmUgd2l0aCBbW3BvcnRdXS5cbiAgICovXG4gIGluc3RhbmNlTmFtZT86IHN0cmluZyB8IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogVGhlIGRlZmF1bHQgaXNvbGF0aW9uIGxldmVsIHRoYXQgdHJhbnNhY3Rpb25zIHdpbGwgYmUgcnVuIHdpdGguXG4gICAqXG4gICAqIFRoZSBpc29sYXRpb24gbGV2ZWxzIGFyZSBhdmFpbGFibGUgZnJvbSBgcmVxdWlyZSgndGVkaW91cycpLklTT0xBVElPTl9MRVZFTGAuXG4gICAqICogYFJFQURfVU5DT01NSVRURURgXG4gICAqICogYFJFQURfQ09NTUlUVEVEYFxuICAgKiAqIGBSRVBFQVRBQkxFX1JFQURgXG4gICAqICogYFNFUklBTElaQUJMRWBcbiAgICogKiBgU05BUFNIT1RgXG4gICAqXG4gICAqIChkZWZhdWx0OiBgUkVBRF9DT01NSVRFRGApLlxuICAgKi9cbiAgaXNvbGF0aW9uTGV2ZWw/OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFNwZWNpZmllcyB0aGUgbGFuZ3VhZ2UgZW52aXJvbm1lbnQgZm9yIHRoZSBzZXNzaW9uLiBUaGUgc2Vzc2lvbiBsYW5ndWFnZSBkZXRlcm1pbmVzIHRoZSBkYXRldGltZSBmb3JtYXRzIGFuZCBzeXN0ZW0gbWVzc2FnZXMuXG4gICAqXG4gICAqIChkZWZhdWx0OiBgdXNfZW5nbGlzaGApLlxuICAgKi9cbiAgbGFuZ3VhZ2U/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEEgc3RyaW5nIGluZGljYXRpbmcgd2hpY2ggbmV0d29yayBpbnRlcmZhY2UgKGlwIGFkZHJlc3MpIHRvIHVzZSB3aGVuIGNvbm5lY3RpbmcgdG8gU1FMIFNlcnZlci5cbiAgICovXG4gIGxvY2FsQWRkcmVzcz86IHN0cmluZyB8IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogQSBib29sZWFuIGRldGVybWluaW5nIHdoZXRoZXIgdG8gcGFyc2UgdW5pcXVlIGlkZW50aWZpZXIgdHlwZSB3aXRoIGxvd2VyY2FzZSBjYXNlIGNoYXJhY3RlcnMuXG4gICAqXG4gICAqIChkZWZhdWx0OiBgZmFsc2VgKS5cbiAgICovXG4gIGxvd2VyQ2FzZUd1aWRzPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogVGhlIG1heGltdW0gbnVtYmVyIG9mIGNvbm5lY3Rpb24gcmV0cmllcyBmb3IgdHJhbnNpZW50IGVycm9ycy7jgIFcbiAgICpcbiAgICogKGRlZmF1bHQ6IGAzYCkuXG4gICAqL1xuICBtYXhSZXRyaWVzT25UcmFuc2llbnRFcnJvcnM/OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIE11bHRpU3VibmV0RmFpbG92ZXIgPSBUcnVlIHBhcmFtZXRlciwgd2hpY2ggY2FuIGhlbHAgbWluaW1pemUgdGhlIGNsaWVudCByZWNvdmVyeSBsYXRlbmN5IHdoZW4gZmFpbG92ZXJzIG9jY3VyLlxuICAgKlxuICAgKiAoZGVmYXVsdDogYGZhbHNlYCkuXG4gICAqL1xuICBtdWx0aVN1Ym5ldEZhaWxvdmVyPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogVGhlIHNpemUgb2YgVERTIHBhY2tldHMgKHN1YmplY3QgdG8gbmVnb3RpYXRpb24gd2l0aCB0aGUgc2VydmVyKS5cbiAgICogU2hvdWxkIGJlIGEgcG93ZXIgb2YgMi5cbiAgICpcbiAgICogKGRlZmF1bHQ6IGA0MDk2YCkuXG4gICAqL1xuICBwYWNrZXRTaXplPzogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBQb3J0IHRvIGNvbm5lY3QgdG8gKGRlZmF1bHQ6IGAxNDMzYCkuXG4gICAqXG4gICAqIE11dHVhbGx5IGV4Y2x1c2l2ZSB3aXRoIFtbaW5zdGFuY2VOYW1lXV1cbiAgICovXG4gIHBvcnQ/OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEEgYm9vbGVhbiwgZGV0ZXJtaW5pbmcgd2hldGhlciB0aGUgY29ubmVjdGlvbiB3aWxsIHJlcXVlc3QgcmVhZCBvbmx5IGFjY2VzcyBmcm9tIGEgU1FMIFNlcnZlciBBdmFpbGFiaWxpdHlcbiAgICogR3JvdXAuIEZvciBtb3JlIGluZm9ybWF0aW9uLCBzZWUgW2hlcmVdKGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9oaDcxMDA1NC5hc3B4IFwiTWljcm9zb2Z0OiBDb25maWd1cmUgUmVhZC1Pbmx5IFJvdXRpbmcgZm9yIGFuIEF2YWlsYWJpbGl0eSBHcm91cCAoU1FMIFNlcnZlcilcIilcbiAgICpcbiAgICogKGRlZmF1bHQ6IGBmYWxzZWApLlxuICAgKi9cbiAgcmVhZE9ubHlJbnRlbnQ/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyBiZWZvcmUgYSByZXF1ZXN0IGlzIGNvbnNpZGVyZWQgZmFpbGVkLCBvciBgMGAgZm9yIG5vIHRpbWVvdXQuXG4gICAqXG4gICAqIEFzIHNvb24gYXMgYSByZXNwb25zZSBpcyByZWNlaXZlZCwgdGhlIHRpbWVvdXQgaXMgY2xlYXJlZC4gVGhpcyBtZWFucyB0aGF0IHF1ZXJpZXMgdGhhdCBpbW1lZGlhdGVseSByZXR1cm4gYSByZXNwb25zZSBoYXZlIGFiaWxpdHkgdG8gcnVuIGxvbmdlciB0aGFuIHRoaXMgdGltZW91dC5cbiAgICpcbiAgICogKGRlZmF1bHQ6IGAxNTAwMGApLlxuICAgKi9cbiAgcmVxdWVzdFRpbWVvdXQ/OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEEgYm9vbGVhbiwgdGhhdCB3aGVuIHRydWUgd2lsbCBleHBvc2UgcmVjZWl2ZWQgcm93cyBpbiBSZXF1ZXN0cyBkb25lIHJlbGF0ZWQgZXZlbnRzOlxuICAgKiAqIFtbUmVxdWVzdC5FdmVudF9kb25lSW5Qcm9jXV1cbiAgICogKiBbW1JlcXVlc3QuRXZlbnRfZG9uZVByb2NdXVxuICAgKiAqIFtbUmVxdWVzdC5FdmVudF9kb25lXV1cbiAgICpcbiAgICogKGRlZmF1bHQ6IGBmYWxzZWApXG4gICAqXG4gICAqIENhdXRpb246IElmIG1hbnkgcm93IGFyZSByZWNlaXZlZCwgZW5hYmxpbmcgdGhpcyBvcHRpb24gY291bGQgcmVzdWx0IGluXG4gICAqIGV4Y2Vzc2l2ZSBtZW1vcnkgdXNhZ2UuXG4gICAqL1xuICByb3dDb2xsZWN0aW9uT25Eb25lPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogQSBib29sZWFuLCB0aGF0IHdoZW4gdHJ1ZSB3aWxsIGV4cG9zZSByZWNlaXZlZCByb3dzIGluIFJlcXVlc3RzJyBjb21wbGV0aW9uIGNhbGxiYWNrLlNlZSBbW1JlcXVlc3QuY29uc3RydWN0b3JdXS5cbiAgICpcbiAgICogKGRlZmF1bHQ6IGBmYWxzZWApXG4gICAqXG4gICAqIENhdXRpb246IElmIG1hbnkgcm93IGFyZSByZWNlaXZlZCwgZW5hYmxpbmcgdGhpcyBvcHRpb24gY291bGQgcmVzdWx0IGluXG4gICAqIGV4Y2Vzc2l2ZSBtZW1vcnkgdXNhZ2UuXG4gICAqL1xuICByb3dDb2xsZWN0aW9uT25SZXF1ZXN0Q29tcGxldGlvbj86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFRoZSB2ZXJzaW9uIG9mIFREUyB0byB1c2UuIElmIHNlcnZlciBkb2Vzbid0IHN1cHBvcnQgc3BlY2lmaWVkIHZlcnNpb24sIG5lZ290aWF0ZWQgdmVyc2lvbiBpcyB1c2VkIGluc3RlYWQuXG4gICAqXG4gICAqIFRoZSB2ZXJzaW9ucyBhcmUgYXZhaWxhYmxlIGZyb20gYHJlcXVpcmUoJ3RlZGlvdXMnKS5URFNfVkVSU0lPTmAuXG4gICAqICogYDdfMWBcbiAgICogKiBgN18yYFxuICAgKiAqIGA3XzNfQWBcbiAgICogKiBgN18zX0JgXG4gICAqICogYDdfNGBcbiAgICpcbiAgICogKGRlZmF1bHQ6IGA3XzRgKVxuICAgKi9cbiAgdGRzVmVyc2lvbj86IHN0cmluZztcblxuICAvKipcbiAgICogU3BlY2lmaWVzIHRoZSBzaXplIG9mIHZhcmNoYXIobWF4KSwgbnZhcmNoYXIobWF4KSwgdmFyYmluYXJ5KG1heCksIHRleHQsIG50ZXh0LCBhbmQgaW1hZ2UgZGF0YSByZXR1cm5lZCBieSBhIFNFTEVDVCBzdGF0ZW1lbnQuXG4gICAqXG4gICAqIChkZWZhdWx0OiBgMjE0NzQ4MzY0N2ApXG4gICAqL1xuICB0ZXh0c2l6ZT86IHN0cmluZztcblxuICAvKipcbiAgICogSWYgXCJ0cnVlXCIsIHRoZSBTUUwgU2VydmVyIFNTTCBjZXJ0aWZpY2F0ZSBpcyBhdXRvbWF0aWNhbGx5IHRydXN0ZWQgd2hlbiB0aGUgY29tbXVuaWNhdGlvbiBsYXllciBpcyBlbmNyeXB0ZWQgdXNpbmcgU1NMLlxuICAgKlxuICAgKiBJZiBcImZhbHNlXCIsIHRoZSBTUUwgU2VydmVyIHZhbGlkYXRlcyB0aGUgc2VydmVyIFNTTCBjZXJ0aWZpY2F0ZS4gSWYgdGhlIHNlcnZlciBjZXJ0aWZpY2F0ZSB2YWxpZGF0aW9uIGZhaWxzLFxuICAgKiB0aGUgZHJpdmVyIHJhaXNlcyBhbiBlcnJvciBhbmQgdGVybWluYXRlcyB0aGUgY29ubmVjdGlvbi4gTWFrZSBzdXJlIHRoZSB2YWx1ZSBwYXNzZWQgdG8gc2VydmVyTmFtZSBleGFjdGx5XG4gICAqIG1hdGNoZXMgdGhlIENvbW1vbiBOYW1lIChDTikgb3IgRE5TIG5hbWUgaW4gdGhlIFN1YmplY3QgQWx0ZXJuYXRlIE5hbWUgaW4gdGhlIHNlcnZlciBjZXJ0aWZpY2F0ZSBmb3IgYW4gU1NMIGNvbm5lY3Rpb24gdG8gc3VjY2VlZC5cbiAgICpcbiAgICogKGRlZmF1bHQ6IGB0cnVlYClcbiAgICovXG4gIHRydXN0U2VydmVyQ2VydGlmaWNhdGU/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKlxuICAgKi9cbiAgc2VydmVyTmFtZT86IHN0cmluZztcbiAgLyoqXG4gICAqIEEgYm9vbGVhbiBkZXRlcm1pbmluZyB3aGV0aGVyIHRvIHJldHVybiByb3dzIGFzIGFycmF5cyBvciBrZXktdmFsdWUgY29sbGVjdGlvbnMuXG4gICAqXG4gICAqIChkZWZhdWx0OiBgZmFsc2VgKS5cbiAgICovXG4gIHVzZUNvbHVtbk5hbWVzPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogQSBib29sZWFuIGRldGVybWluaW5nIHdoZXRoZXIgdG8gcGFzcyB0aW1lIHZhbHVlcyBpbiBVVEMgb3IgbG9jYWwgdGltZS5cbiAgICpcbiAgICogKGRlZmF1bHQ6IGB0cnVlYCkuXG4gICAqL1xuICB1c2VVVEM/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBUaGUgd29ya3N0YXRpb24gSUQgKFdTSUQpIG9mIHRoZSBjbGllbnQsIGRlZmF1bHQgb3MuaG9zdG5hbWUoKS5cbiAgICogVXNlZCBmb3IgaWRlbnRpZnlpbmcgYSBzcGVjaWZpYyBjbGllbnQgaW4gcHJvZmlsaW5nLCBsb2dnaW5nIG9yXG4gICAqIHRyYWNpbmcgY2xpZW50IGFjdGl2aXR5IGluIFNRTFNlcnZlci5cbiAgICpcbiAgICogVGhlIHZhbHVlIGlzIHJlcG9ydGVkIGJ5IHRoZSBUU1FMIGZ1bmN0aW9uIEhPU1RfTkFNRSgpLlxuICAgKi9cbiAgd29ya3N0YXRpb25JZD86IHN0cmluZyB8IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICovXG5jb25zdCBDTEVBTlVQX1RZUEUgPSB7XG4gIE5PUk1BTDogMCxcbiAgUkVESVJFQ1Q6IDEsXG4gIFJFVFJZOiAyXG59O1xuXG5pbnRlcmZhY2UgUm91dGluZ0RhdGEge1xuICBzZXJ2ZXI6IHN0cmluZztcbiAgcG9ydDogbnVtYmVyO1xufVxuXG4vKipcbiAqIEEgW1tDb25uZWN0aW9uXV0gaW5zdGFuY2UgcmVwcmVzZW50cyBhIHNpbmdsZSBjb25uZWN0aW9uIHRvIGEgZGF0YWJhc2Ugc2VydmVyLlxuICpcbiAqIGBgYGpzXG4gKiB2YXIgQ29ubmVjdGlvbiA9IHJlcXVpcmUoJ3RlZGlvdXMnKS5Db25uZWN0aW9uO1xuICogdmFyIGNvbmZpZyA9IHtcbiAqICBcImF1dGhlbnRpY2F0aW9uXCI6IHtcbiAqICAgIC4uLixcbiAqICAgIFwib3B0aW9uc1wiOiB7Li4ufVxuICogIH0sXG4gKiAgXCJvcHRpb25zXCI6IHsuLi59XG4gKiB9O1xuICogdmFyIGNvbm5lY3Rpb24gPSBuZXcgQ29ubmVjdGlvbihjb25maWcpO1xuICogYGBgXG4gKlxuICogT25seSBvbmUgcmVxdWVzdCBhdCBhIHRpbWUgbWF5IGJlIGV4ZWN1dGVkIG9uIGEgY29ubmVjdGlvbi4gT25jZSBhIFtbUmVxdWVzdF1dXG4gKiBoYXMgYmVlbiBpbml0aWF0ZWQgKHdpdGggW1tDb25uZWN0aW9uLmNhbGxQcm9jZWR1cmVdXSwgW1tDb25uZWN0aW9uLmV4ZWNTcWxdXSxcbiAqIG9yIFtbQ29ubmVjdGlvbi5leGVjU3FsQmF0Y2hdXSksIGFub3RoZXIgc2hvdWxkIG5vdCBiZSBpbml0aWF0ZWQgdW50aWwgdGhlXG4gKiBbW1JlcXVlc3RdXSdzIGNvbXBsZXRpb24gY2FsbGJhY2sgaXMgY2FsbGVkLlxuICovXG5jbGFzcyBDb25uZWN0aW9uIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBkZWNsYXJlIGZlZEF1dGhSZXF1aXJlZDogYm9vbGVhbjtcbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBkZWNsYXJlIGNvbmZpZzogSW50ZXJuYWxDb25uZWN0aW9uQ29uZmlnO1xuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGRlY2xhcmUgc2VjdXJlQ29udGV4dE9wdGlvbnM6IFNlY3VyZUNvbnRleHRPcHRpb25zO1xuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGRlY2xhcmUgaW5UcmFuc2FjdGlvbjogYm9vbGVhbjtcbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBkZWNsYXJlIHRyYW5zYWN0aW9uRGVzY3JpcHRvcnM6IEJ1ZmZlcltdO1xuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGRlY2xhcmUgdHJhbnNhY3Rpb25EZXB0aDogbnVtYmVyO1xuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGRlY2xhcmUgaXNTcWxCYXRjaDogYm9vbGVhbjtcbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBkZWNsYXJlIGN1clRyYW5zaWVudFJldHJ5Q291bnQ6IG51bWJlcjtcbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBkZWNsYXJlIHRyYW5zaWVudEVycm9yTG9va3VwOiBUcmFuc2llbnRFcnJvckxvb2t1cDtcbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBkZWNsYXJlIGNsb3NlZDogYm9vbGVhbjtcbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBkZWNsYXJlIGxvZ2luRXJyb3I6IHVuZGVmaW5lZCB8IEFnZ3JlZ2F0ZUVycm9yIHwgQ29ubmVjdGlvbkVycm9yO1xuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGRlY2xhcmUgZGVidWc6IERlYnVnO1xuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGRlY2xhcmUgbnRsbXBhY2tldDogdW5kZWZpbmVkIHwgYW55O1xuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGRlY2xhcmUgbnRsbXBhY2tldEJ1ZmZlcjogdW5kZWZpbmVkIHwgQnVmZmVyO1xuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZGVjbGFyZSBTVEFURToge1xuICAgIElOSVRJQUxJWkVEOiBTdGF0ZTtcbiAgICBDT05ORUNUSU5HOiBTdGF0ZTtcbiAgICBTRU5UX1BSRUxPR0lOOiBTdGF0ZTtcbiAgICBSRVJPVVRJTkc6IFN0YXRlO1xuICAgIFRSQU5TSUVOVF9GQUlMVVJFX1JFVFJZOiBTdGF0ZTtcbiAgICBTRU5UX1RMU1NTTE5FR09USUFUSU9OOiBTdGF0ZTtcbiAgICBTRU5UX0xPR0lON19XSVRIX1NUQU5EQVJEX0xPR0lOOiBTdGF0ZTtcbiAgICBTRU5UX0xPR0lON19XSVRIX05UTE06IFN0YXRlO1xuICAgIFNFTlRfTE9HSU43X1dJVEhfRkVEQVVUSDogU3RhdGU7XG4gICAgTE9HR0VEX0lOX1NFTkRJTkdfSU5JVElBTF9TUUw6IFN0YXRlO1xuICAgIExPR0dFRF9JTjogU3RhdGU7XG4gICAgU0VOVF9DTElFTlRfUkVRVUVTVDogU3RhdGU7XG4gICAgU0VOVF9BVFRFTlRJT046IFN0YXRlO1xuICAgIEZJTkFMOiBTdGF0ZTtcbiAgfTtcblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGRlY2xhcmUgcm91dGluZ0RhdGE6IHVuZGVmaW5lZCB8IFJvdXRpbmdEYXRhO1xuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZGVjbGFyZSBtZXNzYWdlSW86IE1lc3NhZ2VJTztcbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBkZWNsYXJlIHN0YXRlOiBTdGF0ZTtcbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBkZWNsYXJlIHJlc2V0Q29ubmVjdGlvbk9uTmV4dFJlcXVlc3Q6IHVuZGVmaW5lZCB8IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBkZWNsYXJlIHJlcXVlc3Q6IHVuZGVmaW5lZCB8IFJlcXVlc3QgfCBCdWxrTG9hZDtcbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBkZWNsYXJlIHByb2NSZXR1cm5TdGF0dXNWYWx1ZTogdW5kZWZpbmVkIHwgYW55O1xuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGRlY2xhcmUgc29ja2V0OiB1bmRlZmluZWQgfCBuZXQuU29ja2V0O1xuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGRlY2xhcmUgbWVzc2FnZUJ1ZmZlcjogQnVmZmVyO1xuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZGVjbGFyZSBjb25uZWN0VGltZXI6IHVuZGVmaW5lZCB8IE5vZGVKUy5UaW1lb3V0O1xuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGRlY2xhcmUgY2FuY2VsVGltZXI6IHVuZGVmaW5lZCB8IE5vZGVKUy5UaW1lb3V0O1xuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGRlY2xhcmUgcmVxdWVzdFRpbWVyOiB1bmRlZmluZWQgfCBOb2RlSlMuVGltZW91dDtcbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBkZWNsYXJlIHJldHJ5VGltZXI6IHVuZGVmaW5lZCB8IE5vZGVKUy5UaW1lb3V0O1xuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2NhbmNlbEFmdGVyUmVxdWVzdFNlbnQ6ICgpID0+IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBkZWNsYXJlIGRhdGFiYXNlQ29sbGF0aW9uOiBDb2xsYXRpb24gfCB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIE5vdGU6IGJlIGF3YXJlIG9mIHRoZSBkaWZmZXJlbnQgb3B0aW9ucyBmaWVsZDpcbiAgICogMS4gY29uZmlnLmF1dGhlbnRpY2F0aW9uLm9wdGlvbnNcbiAgICogMi4gY29uZmlnLm9wdGlvbnNcbiAgICpcbiAgICogYGBganNcbiAgICogY29uc3QgeyBDb25uZWN0aW9uIH0gPSByZXF1aXJlKCd0ZWRpb3VzJyk7XG4gICAqXG4gICAqIGNvbnN0IGNvbmZpZyA9IHtcbiAgICogIFwiYXV0aGVudGljYXRpb25cIjoge1xuICAgKiAgICAuLi4sXG4gICAqICAgIFwib3B0aW9uc1wiOiB7Li4ufVxuICAgKiAgfSxcbiAgICogIFwib3B0aW9uc1wiOiB7Li4ufVxuICAgKiB9O1xuICAgKlxuICAgKiBjb25zdCBjb25uZWN0aW9uID0gbmV3IENvbm5lY3Rpb24oY29uZmlnKTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBjb25maWdcbiAgICovXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogQ29ubmVjdGlvbkNvbmZpZ3VyYXRpb24pIHtcbiAgICBzdXBlcigpO1xuXG4gICAgaWYgKHR5cGVvZiBjb25maWcgIT09ICdvYmplY3QnIHx8IGNvbmZpZyA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnXCIgYXJndW1lbnQgaXMgcmVxdWlyZWQgYW5kIG11c3QgYmUgb2YgdHlwZSBPYmplY3QuJyk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBjb25maWcuc2VydmVyICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLnNlcnZlclwiIHByb3BlcnR5IGlzIHJlcXVpcmVkIGFuZCBtdXN0IGJlIG9mIHR5cGUgc3RyaW5nLicpO1xuICAgIH1cblxuICAgIHRoaXMuZmVkQXV0aFJlcXVpcmVkID0gZmFsc2U7XG5cbiAgICBsZXQgYXV0aGVudGljYXRpb246IEludGVybmFsQ29ubmVjdGlvbkNvbmZpZ1snYXV0aGVudGljYXRpb24nXTtcbiAgICBpZiAoY29uZmlnLmF1dGhlbnRpY2F0aW9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0eXBlb2YgY29uZmlnLmF1dGhlbnRpY2F0aW9uICE9PSAnb2JqZWN0JyB8fCBjb25maWcuYXV0aGVudGljYXRpb24gPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLmF1dGhlbnRpY2F0aW9uXCIgcHJvcGVydHkgbXVzdCBiZSBvZiB0eXBlIE9iamVjdC4nKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdHlwZSA9IGNvbmZpZy5hdXRoZW50aWNhdGlvbi50eXBlO1xuICAgICAgY29uc3Qgb3B0aW9ucyA9IGNvbmZpZy5hdXRoZW50aWNhdGlvbi5vcHRpb25zID09PSB1bmRlZmluZWQgPyB7fSA6IGNvbmZpZy5hdXRoZW50aWNhdGlvbi5vcHRpb25zO1xuXG4gICAgICBpZiAodHlwZW9mIHR5cGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBcImNvbmZpZy5hdXRoZW50aWNhdGlvbi50eXBlXCIgcHJvcGVydHkgbXVzdCBiZSBvZiB0eXBlIHN0cmluZy4nKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGUgIT09ICdkZWZhdWx0JyAmJiB0eXBlICE9PSAnbnRsbScgJiYgdHlwZSAhPT0gJ2F6dXJlLWFjdGl2ZS1kaXJlY3RvcnktcGFzc3dvcmQnICYmIHR5cGUgIT09ICdhenVyZS1hY3RpdmUtZGlyZWN0b3J5LWFjY2Vzcy10b2tlbicgJiYgdHlwZSAhPT0gJ2F6dXJlLWFjdGl2ZS1kaXJlY3RvcnktbXNpLXZtJyAmJiB0eXBlICE9PSAnYXp1cmUtYWN0aXZlLWRpcmVjdG9yeS1tc2ktYXBwLXNlcnZpY2UnICYmIHR5cGUgIT09ICdhenVyZS1hY3RpdmUtZGlyZWN0b3J5LXNlcnZpY2UtcHJpbmNpcGFsLXNlY3JldCcgJiYgdHlwZSAhPT0gJ2F6dXJlLWFjdGl2ZS1kaXJlY3RvcnktZGVmYXVsdCcpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwidHlwZVwiIHByb3BlcnR5IG11c3Qgb25lIG9mIFwiZGVmYXVsdFwiLCBcIm50bG1cIiwgXCJhenVyZS1hY3RpdmUtZGlyZWN0b3J5LXBhc3N3b3JkXCIsIFwiYXp1cmUtYWN0aXZlLWRpcmVjdG9yeS1hY2Nlc3MtdG9rZW5cIiwgXCJhenVyZS1hY3RpdmUtZGlyZWN0b3J5LWRlZmF1bHRcIiwgXCJhenVyZS1hY3RpdmUtZGlyZWN0b3J5LW1zaS12bVwiIG9yIFwiYXp1cmUtYWN0aXZlLWRpcmVjdG9yeS1tc2ktYXBwLXNlcnZpY2VcIiBvciBcImF6dXJlLWFjdGl2ZS1kaXJlY3Rvcnktc2VydmljZS1wcmluY2lwYWwtc2VjcmV0XCIuJyk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucyAhPT0gJ29iamVjdCcgfHwgb3B0aW9ucyA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJjb25maWcuYXV0aGVudGljYXRpb24ub3B0aW9uc1wiIHByb3BlcnR5IG11c3QgYmUgb2YgdHlwZSBvYmplY3QuJyk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlID09PSAnbnRsbScpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmRvbWFpbiAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJjb25maWcuYXV0aGVudGljYXRpb24ub3B0aW9ucy5kb21haW5cIiBwcm9wZXJ0eSBtdXN0IGJlIG9mIHR5cGUgc3RyaW5nLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9wdGlvbnMudXNlck5hbWUgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb3B0aW9ucy51c2VyTmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJjb25maWcuYXV0aGVudGljYXRpb24ub3B0aW9ucy51c2VyTmFtZVwiIHByb3BlcnR5IG11c3QgYmUgb2YgdHlwZSBzdHJpbmcuJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0aW9ucy5wYXNzd29yZCAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvcHRpb25zLnBhc3N3b3JkICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBcImNvbmZpZy5hdXRoZW50aWNhdGlvbi5vcHRpb25zLnBhc3N3b3JkXCIgcHJvcGVydHkgbXVzdCBiZSBvZiB0eXBlIHN0cmluZy4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uID0ge1xuICAgICAgICAgIHR5cGU6ICdudGxtJyxcbiAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICB1c2VyTmFtZTogb3B0aW9ucy51c2VyTmFtZSxcbiAgICAgICAgICAgIHBhc3N3b3JkOiBvcHRpb25zLnBhc3N3b3JkLFxuICAgICAgICAgICAgZG9tYWluOiBvcHRpb25zLmRvbWFpbiAmJiBvcHRpb25zLmRvbWFpbi50b1VwcGVyQ2FzZSgpXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnYXp1cmUtYWN0aXZlLWRpcmVjdG9yeS1wYXNzd29yZCcpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmNsaWVudElkICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBcImNvbmZpZy5hdXRoZW50aWNhdGlvbi5vcHRpb25zLmNsaWVudElkXCIgcHJvcGVydHkgbXVzdCBiZSBvZiB0eXBlIHN0cmluZy4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvcHRpb25zLnVzZXJOYW1lICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9wdGlvbnMudXNlck5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLmF1dGhlbnRpY2F0aW9uLm9wdGlvbnMudXNlck5hbWVcIiBwcm9wZXJ0eSBtdXN0IGJlIG9mIHR5cGUgc3RyaW5nLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9wdGlvbnMucGFzc3dvcmQgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb3B0aW9ucy5wYXNzd29yZCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJjb25maWcuYXV0aGVudGljYXRpb24ub3B0aW9ucy5wYXNzd29yZFwiIHByb3BlcnR5IG11c3QgYmUgb2YgdHlwZSBzdHJpbmcuJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0aW9ucy50ZW5hbnRJZCAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvcHRpb25zLnRlbmFudElkICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBcImNvbmZpZy5hdXRoZW50aWNhdGlvbi5vcHRpb25zLnRlbmFudElkXCIgcHJvcGVydHkgbXVzdCBiZSBvZiB0eXBlIHN0cmluZy4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uID0ge1xuICAgICAgICAgIHR5cGU6ICdhenVyZS1hY3RpdmUtZGlyZWN0b3J5LXBhc3N3b3JkJyxcbiAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICB1c2VyTmFtZTogb3B0aW9ucy51c2VyTmFtZSxcbiAgICAgICAgICAgIHBhc3N3b3JkOiBvcHRpb25zLnBhc3N3b3JkLFxuICAgICAgICAgICAgdGVuYW50SWQ6IG9wdGlvbnMudGVuYW50SWQsXG4gICAgICAgICAgICBjbGllbnRJZDogb3B0aW9ucy5jbGllbnRJZFxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ2F6dXJlLWFjdGl2ZS1kaXJlY3RvcnktYWNjZXNzLXRva2VuJykge1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMudG9rZW4gIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLmF1dGhlbnRpY2F0aW9uLm9wdGlvbnMudG9rZW5cIiBwcm9wZXJ0eSBtdXN0IGJlIG9mIHR5cGUgc3RyaW5nLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXV0aGVudGljYXRpb24gPSB7XG4gICAgICAgICAgdHlwZTogJ2F6dXJlLWFjdGl2ZS1kaXJlY3RvcnktYWNjZXNzLXRva2VuJyxcbiAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICB0b2tlbjogb3B0aW9ucy50b2tlblxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ2F6dXJlLWFjdGl2ZS1kaXJlY3RvcnktbXNpLXZtJykge1xuICAgICAgICBpZiAob3B0aW9ucy5jbGllbnRJZCAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvcHRpb25zLmNsaWVudElkICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBcImNvbmZpZy5hdXRoZW50aWNhdGlvbi5vcHRpb25zLmNsaWVudElkXCIgcHJvcGVydHkgbXVzdCBiZSBvZiB0eXBlIHN0cmluZy4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uID0ge1xuICAgICAgICAgIHR5cGU6ICdhenVyZS1hY3RpdmUtZGlyZWN0b3J5LW1zaS12bScsXG4gICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgY2xpZW50SWQ6IG9wdGlvbnMuY2xpZW50SWRcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdhenVyZS1hY3RpdmUtZGlyZWN0b3J5LWRlZmF1bHQnKSB7XG4gICAgICAgIGlmIChvcHRpb25zLmNsaWVudElkICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9wdGlvbnMuY2xpZW50SWQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLmF1dGhlbnRpY2F0aW9uLm9wdGlvbnMuY2xpZW50SWRcIiBwcm9wZXJ0eSBtdXN0IGJlIG9mIHR5cGUgc3RyaW5nLicpO1xuICAgICAgICB9XG4gICAgICAgIGF1dGhlbnRpY2F0aW9uID0ge1xuICAgICAgICAgIHR5cGU6ICdhenVyZS1hY3RpdmUtZGlyZWN0b3J5LWRlZmF1bHQnLFxuICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIGNsaWVudElkOiBvcHRpb25zLmNsaWVudElkXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnYXp1cmUtYWN0aXZlLWRpcmVjdG9yeS1tc2ktYXBwLXNlcnZpY2UnKSB7XG4gICAgICAgIGlmIChvcHRpb25zLmNsaWVudElkICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9wdGlvbnMuY2xpZW50SWQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLmF1dGhlbnRpY2F0aW9uLm9wdGlvbnMuY2xpZW50SWRcIiBwcm9wZXJ0eSBtdXN0IGJlIG9mIHR5cGUgc3RyaW5nLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXV0aGVudGljYXRpb24gPSB7XG4gICAgICAgICAgdHlwZTogJ2F6dXJlLWFjdGl2ZS1kaXJlY3RvcnktbXNpLWFwcC1zZXJ2aWNlJyxcbiAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICBjbGllbnRJZDogb3B0aW9ucy5jbGllbnRJZFxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ2F6dXJlLWFjdGl2ZS1kaXJlY3Rvcnktc2VydmljZS1wcmluY2lwYWwtc2VjcmV0Jykge1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuY2xpZW50SWQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLmF1dGhlbnRpY2F0aW9uLm9wdGlvbnMuY2xpZW50SWRcIiBwcm9wZXJ0eSBtdXN0IGJlIG9mIHR5cGUgc3RyaW5nLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmNsaWVudFNlY3JldCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJjb25maWcuYXV0aGVudGljYXRpb24ub3B0aW9ucy5jbGllbnRTZWNyZXRcIiBwcm9wZXJ0eSBtdXN0IGJlIG9mIHR5cGUgc3RyaW5nLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnRlbmFudElkICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBcImNvbmZpZy5hdXRoZW50aWNhdGlvbi5vcHRpb25zLnRlbmFudElkXCIgcHJvcGVydHkgbXVzdCBiZSBvZiB0eXBlIHN0cmluZy4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uID0ge1xuICAgICAgICAgIHR5cGU6ICdhenVyZS1hY3RpdmUtZGlyZWN0b3J5LXNlcnZpY2UtcHJpbmNpcGFsLXNlY3JldCcsXG4gICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgY2xpZW50SWQ6IG9wdGlvbnMuY2xpZW50SWQsXG4gICAgICAgICAgICBjbGllbnRTZWNyZXQ6IG9wdGlvbnMuY2xpZW50U2VjcmV0LFxuICAgICAgICAgICAgdGVuYW50SWQ6IG9wdGlvbnMudGVuYW50SWRcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAob3B0aW9ucy51c2VyTmFtZSAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvcHRpb25zLnVzZXJOYW1lICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBcImNvbmZpZy5hdXRoZW50aWNhdGlvbi5vcHRpb25zLnVzZXJOYW1lXCIgcHJvcGVydHkgbXVzdCBiZSBvZiB0eXBlIHN0cmluZy4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvcHRpb25zLnBhc3N3b3JkICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9wdGlvbnMucGFzc3dvcmQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLmF1dGhlbnRpY2F0aW9uLm9wdGlvbnMucGFzc3dvcmRcIiBwcm9wZXJ0eSBtdXN0IGJlIG9mIHR5cGUgc3RyaW5nLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXV0aGVudGljYXRpb24gPSB7XG4gICAgICAgICAgdHlwZTogJ2RlZmF1bHQnLFxuICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIHVzZXJOYW1lOiBvcHRpb25zLnVzZXJOYW1lLFxuICAgICAgICAgICAgcGFzc3dvcmQ6IG9wdGlvbnMucGFzc3dvcmRcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGF1dGhlbnRpY2F0aW9uID0ge1xuICAgICAgICB0eXBlOiAnZGVmYXVsdCcsXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICB1c2VyTmFtZTogdW5kZWZpbmVkLFxuICAgICAgICAgIHBhc3N3b3JkOiB1bmRlZmluZWRcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG5cbiAgICB0aGlzLmNvbmZpZyA9IHtcbiAgICAgIHNlcnZlcjogY29uZmlnLnNlcnZlcixcbiAgICAgIGF1dGhlbnRpY2F0aW9uOiBhdXRoZW50aWNhdGlvbixcbiAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgYWJvcnRUcmFuc2FjdGlvbk9uRXJyb3I6IGZhbHNlLFxuICAgICAgICBhcHBOYW1lOiB1bmRlZmluZWQsXG4gICAgICAgIGNhbWVsQ2FzZUNvbHVtbnM6IGZhbHNlLFxuICAgICAgICBjYW5jZWxUaW1lb3V0OiBERUZBVUxUX0NBTkNFTF9USU1FT1VULFxuICAgICAgICBjb2x1bW5FbmNyeXB0aW9uS2V5Q2FjaGVUVEw6IDIgKiA2MCAqIDYwICogMTAwMCwgIC8vIFVuaXRzOiBtaWxsaXNlY29uZHNcbiAgICAgICAgY29sdW1uRW5jcnlwdGlvblNldHRpbmc6IGZhbHNlLFxuICAgICAgICBjb2x1bW5OYW1lUmVwbGFjZXI6IHVuZGVmaW5lZCxcbiAgICAgICAgY29ubmVjdGlvblJldHJ5SW50ZXJ2YWw6IERFRkFVTFRfQ09OTkVDVF9SRVRSWV9JTlRFUlZBTCxcbiAgICAgICAgY29ubmVjdFRpbWVvdXQ6IERFRkFVTFRfQ09OTkVDVF9USU1FT1VULFxuICAgICAgICBjb25uZWN0b3I6IHVuZGVmaW5lZCxcbiAgICAgICAgY29ubmVjdGlvbklzb2xhdGlvbkxldmVsOiBJU09MQVRJT05fTEVWRUwuUkVBRF9DT01NSVRURUQsXG4gICAgICAgIGNyeXB0b0NyZWRlbnRpYWxzRGV0YWlsczoge30sXG4gICAgICAgIGRhdGFiYXNlOiB1bmRlZmluZWQsXG4gICAgICAgIGRhdGVmaXJzdDogREVGQVVMVF9EQVRFRklSU1QsXG4gICAgICAgIGRhdGVGb3JtYXQ6IERFRkFVTFRfREFURUZPUk1BVCxcbiAgICAgICAgZGVidWc6IHtcbiAgICAgICAgICBkYXRhOiBmYWxzZSxcbiAgICAgICAgICBwYWNrZXQ6IGZhbHNlLFxuICAgICAgICAgIHBheWxvYWQ6IGZhbHNlLFxuICAgICAgICAgIHRva2VuOiBmYWxzZVxuICAgICAgICB9LFxuICAgICAgICBlbmFibGVBbnNpTnVsbDogdHJ1ZSxcbiAgICAgICAgZW5hYmxlQW5zaU51bGxEZWZhdWx0OiB0cnVlLFxuICAgICAgICBlbmFibGVBbnNpUGFkZGluZzogdHJ1ZSxcbiAgICAgICAgZW5hYmxlQW5zaVdhcm5pbmdzOiB0cnVlLFxuICAgICAgICBlbmFibGVBcml0aEFib3J0OiB0cnVlLFxuICAgICAgICBlbmFibGVDb25jYXROdWxsWWllbGRzTnVsbDogdHJ1ZSxcbiAgICAgICAgZW5hYmxlQ3Vyc29yQ2xvc2VPbkNvbW1pdDogbnVsbCxcbiAgICAgICAgZW5hYmxlSW1wbGljaXRUcmFuc2FjdGlvbnM6IGZhbHNlLFxuICAgICAgICBlbmFibGVOdW1lcmljUm91bmRhYm9ydDogZmFsc2UsXG4gICAgICAgIGVuYWJsZVF1b3RlZElkZW50aWZpZXI6IHRydWUsXG4gICAgICAgIGVuY3J5cHQ6IHRydWUsXG4gICAgICAgIGZhbGxiYWNrVG9EZWZhdWx0RGI6IGZhbHNlLFxuICAgICAgICBlbmNyeXB0aW9uS2V5U3RvcmVQcm92aWRlcnM6IHVuZGVmaW5lZCxcbiAgICAgICAgaW5zdGFuY2VOYW1lOiB1bmRlZmluZWQsXG4gICAgICAgIGlzb2xhdGlvbkxldmVsOiBJU09MQVRJT05fTEVWRUwuUkVBRF9DT01NSVRURUQsXG4gICAgICAgIGxhbmd1YWdlOiBERUZBVUxUX0xBTkdVQUdFLFxuICAgICAgICBsb2NhbEFkZHJlc3M6IHVuZGVmaW5lZCxcbiAgICAgICAgbWF4UmV0cmllc09uVHJhbnNpZW50RXJyb3JzOiAzLFxuICAgICAgICBtdWx0aVN1Ym5ldEZhaWxvdmVyOiBmYWxzZSxcbiAgICAgICAgcGFja2V0U2l6ZTogREVGQVVMVF9QQUNLRVRfU0laRSxcbiAgICAgICAgcG9ydDogREVGQVVMVF9QT1JULFxuICAgICAgICByZWFkT25seUludGVudDogZmFsc2UsXG4gICAgICAgIHJlcXVlc3RUaW1lb3V0OiBERUZBVUxUX0NMSUVOVF9SRVFVRVNUX1RJTUVPVVQsXG4gICAgICAgIHJvd0NvbGxlY3Rpb25PbkRvbmU6IGZhbHNlLFxuICAgICAgICByb3dDb2xsZWN0aW9uT25SZXF1ZXN0Q29tcGxldGlvbjogZmFsc2UsXG4gICAgICAgIHNlcnZlck5hbWU6IHVuZGVmaW5lZCxcbiAgICAgICAgc2VydmVyU3VwcG9ydHNDb2x1bW5FbmNyeXB0aW9uOiBmYWxzZSxcbiAgICAgICAgdGRzVmVyc2lvbjogREVGQVVMVF9URFNfVkVSU0lPTixcbiAgICAgICAgdGV4dHNpemU6IERFRkFVTFRfVEVYVFNJWkUsXG4gICAgICAgIHRydXN0ZWRTZXJ2ZXJOYW1lQUU6IHVuZGVmaW5lZCxcbiAgICAgICAgdHJ1c3RTZXJ2ZXJDZXJ0aWZpY2F0ZTogZmFsc2UsXG4gICAgICAgIHVzZUNvbHVtbk5hbWVzOiBmYWxzZSxcbiAgICAgICAgdXNlVVRDOiB0cnVlLFxuICAgICAgICB3b3Jrc3RhdGlvbklkOiB1bmRlZmluZWQsXG4gICAgICAgIGxvd2VyQ2FzZUd1aWRzOiBmYWxzZVxuICAgICAgfVxuICAgIH07XG5cbiAgICBpZiAoY29uZmlnLm9wdGlvbnMpIHtcbiAgICAgIGlmIChjb25maWcub3B0aW9ucy5wb3J0ICYmIGNvbmZpZy5vcHRpb25zLmluc3RhbmNlTmFtZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BvcnQgYW5kIGluc3RhbmNlTmFtZSBhcmUgbXV0dWFsbHkgZXhjbHVzaXZlLCBidXQgJyArIGNvbmZpZy5vcHRpb25zLnBvcnQgKyAnIGFuZCAnICsgY29uZmlnLm9wdGlvbnMuaW5zdGFuY2VOYW1lICsgJyBwcm92aWRlZCcpO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29uZmlnLm9wdGlvbnMuYWJvcnRUcmFuc2FjdGlvbk9uRXJyb3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5vcHRpb25zLmFib3J0VHJhbnNhY3Rpb25PbkVycm9yICE9PSAnYm9vbGVhbicgJiYgY29uZmlnLm9wdGlvbnMuYWJvcnRUcmFuc2FjdGlvbk9uRXJyb3IgIT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJjb25maWcub3B0aW9ucy5hYm9ydFRyYW5zYWN0aW9uT25FcnJvclwiIHByb3BlcnR5IG11c3QgYmUgb2YgdHlwZSBzdHJpbmcgb3IgbnVsbC4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29uZmlnLm9wdGlvbnMuYWJvcnRUcmFuc2FjdGlvbk9uRXJyb3IgPSBjb25maWcub3B0aW9ucy5hYm9ydFRyYW5zYWN0aW9uT25FcnJvcjtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbmZpZy5vcHRpb25zLmFwcE5hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5vcHRpb25zLmFwcE5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLm9wdGlvbnMuYXBwTmFtZVwiIHByb3BlcnR5IG11c3QgYmUgb2YgdHlwZSBzdHJpbmcuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbmZpZy5vcHRpb25zLmFwcE5hbWUgPSBjb25maWcub3B0aW9ucy5hcHBOYW1lO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29uZmlnLm9wdGlvbnMuY2FtZWxDYXNlQ29sdW1ucyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uZmlnLm9wdGlvbnMuY2FtZWxDYXNlQ29sdW1ucyAhPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLm9wdGlvbnMuY2FtZWxDYXNlQ29sdW1uc1wiIHByb3BlcnR5IG11c3QgYmUgb2YgdHlwZSBib29sZWFuLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb25maWcub3B0aW9ucy5jYW1lbENhc2VDb2x1bW5zID0gY29uZmlnLm9wdGlvbnMuY2FtZWxDYXNlQ29sdW1ucztcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbmZpZy5vcHRpb25zLmNhbmNlbFRpbWVvdXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5vcHRpb25zLmNhbmNlbFRpbWVvdXQgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLm9wdGlvbnMuY2FuY2VsVGltZW91dFwiIHByb3BlcnR5IG11c3QgYmUgb2YgdHlwZSBudW1iZXIuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbmZpZy5vcHRpb25zLmNhbmNlbFRpbWVvdXQgPSBjb25maWcub3B0aW9ucy5jYW5jZWxUaW1lb3V0O1xuICAgICAgfVxuXG4gICAgICBpZiAoY29uZmlnLm9wdGlvbnMuY29sdW1uTmFtZVJlcGxhY2VyKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uZmlnLm9wdGlvbnMuY29sdW1uTmFtZVJlcGxhY2VyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLm9wdGlvbnMuY2FuY2VsVGltZW91dFwiIHByb3BlcnR5IG11c3QgYmUgb2YgdHlwZSBmdW5jdGlvbi4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29uZmlnLm9wdGlvbnMuY29sdW1uTmFtZVJlcGxhY2VyID0gY29uZmlnLm9wdGlvbnMuY29sdW1uTmFtZVJlcGxhY2VyO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29uZmlnLm9wdGlvbnMuY29ubmVjdGlvbklzb2xhdGlvbkxldmVsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYXNzZXJ0VmFsaWRJc29sYXRpb25MZXZlbChjb25maWcub3B0aW9ucy5jb25uZWN0aW9uSXNvbGF0aW9uTGV2ZWwsICdjb25maWcub3B0aW9ucy5jb25uZWN0aW9uSXNvbGF0aW9uTGV2ZWwnKTtcblxuICAgICAgICB0aGlzLmNvbmZpZy5vcHRpb25zLmNvbm5lY3Rpb25Jc29sYXRpb25MZXZlbCA9IGNvbmZpZy5vcHRpb25zLmNvbm5lY3Rpb25Jc29sYXRpb25MZXZlbDtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbmZpZy5vcHRpb25zLmNvbm5lY3RUaW1lb3V0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25maWcub3B0aW9ucy5jb25uZWN0VGltZW91dCAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJjb25maWcub3B0aW9ucy5jb25uZWN0VGltZW91dFwiIHByb3BlcnR5IG11c3QgYmUgb2YgdHlwZSBudW1iZXIuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbmZpZy5vcHRpb25zLmNvbm5lY3RUaW1lb3V0ID0gY29uZmlnLm9wdGlvbnMuY29ubmVjdFRpbWVvdXQ7XG4gICAgICB9XG5cbiAgICAgIGlmIChjb25maWcub3B0aW9ucy5jb25uZWN0b3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5vcHRpb25zLmNvbm5lY3RvciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBcImNvbmZpZy5vcHRpb25zLmNvbm5lY3RvclwiIHByb3BlcnR5IG11c3QgYmUgYSBmdW5jdGlvbi4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29uZmlnLm9wdGlvbnMuY29ubmVjdG9yID0gY29uZmlnLm9wdGlvbnMuY29ubmVjdG9yO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29uZmlnLm9wdGlvbnMuY3J5cHRvQ3JlZGVudGlhbHNEZXRhaWxzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25maWcub3B0aW9ucy5jcnlwdG9DcmVkZW50aWFsc0RldGFpbHMgIT09ICdvYmplY3QnIHx8IGNvbmZpZy5vcHRpb25zLmNyeXB0b0NyZWRlbnRpYWxzRGV0YWlscyA9PT0gbnVsbCkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBcImNvbmZpZy5vcHRpb25zLmNyeXB0b0NyZWRlbnRpYWxzRGV0YWlsc1wiIHByb3BlcnR5IG11c3QgYmUgb2YgdHlwZSBPYmplY3QuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbmZpZy5vcHRpb25zLmNyeXB0b0NyZWRlbnRpYWxzRGV0YWlscyA9IGNvbmZpZy5vcHRpb25zLmNyeXB0b0NyZWRlbnRpYWxzRGV0YWlscztcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbmZpZy5vcHRpb25zLmRhdGFiYXNlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25maWcub3B0aW9ucy5kYXRhYmFzZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJjb25maWcub3B0aW9ucy5kYXRhYmFzZVwiIHByb3BlcnR5IG11c3QgYmUgb2YgdHlwZSBzdHJpbmcuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbmZpZy5vcHRpb25zLmRhdGFiYXNlID0gY29uZmlnLm9wdGlvbnMuZGF0YWJhc2U7XG4gICAgICB9XG5cbiAgICAgIGlmIChjb25maWcub3B0aW9ucy5kYXRlZmlyc3QgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5vcHRpb25zLmRhdGVmaXJzdCAhPT0gJ251bWJlcicgJiYgY29uZmlnLm9wdGlvbnMuZGF0ZWZpcnN0ICE9PSBudWxsKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLm9wdGlvbnMuZGF0ZWZpcnN0XCIgcHJvcGVydHkgbXVzdCBiZSBvZiB0eXBlIG51bWJlci4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb25maWcub3B0aW9ucy5kYXRlZmlyc3QgIT09IG51bGwgJiYgKGNvbmZpZy5vcHRpb25zLmRhdGVmaXJzdCA8IDEgfHwgY29uZmlnLm9wdGlvbnMuZGF0ZWZpcnN0ID4gNykpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVGhlIFwiY29uZmlnLm9wdGlvbnMuZGF0ZWZpcnN0XCIgcHJvcGVydHkgbXVzdCBiZSA+PSAxIGFuZCA8PSA3Jyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbmZpZy5vcHRpb25zLmRhdGVmaXJzdCA9IGNvbmZpZy5vcHRpb25zLmRhdGVmaXJzdDtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbmZpZy5vcHRpb25zLmRhdGVGb3JtYXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5vcHRpb25zLmRhdGVGb3JtYXQgIT09ICdzdHJpbmcnICYmIGNvbmZpZy5vcHRpb25zLmRhdGVGb3JtYXQgIT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJjb25maWcub3B0aW9ucy5kYXRlRm9ybWF0XCIgcHJvcGVydHkgbXVzdCBiZSBvZiB0eXBlIHN0cmluZyBvciBudWxsLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb25maWcub3B0aW9ucy5kYXRlRm9ybWF0ID0gY29uZmlnLm9wdGlvbnMuZGF0ZUZvcm1hdDtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbmZpZy5vcHRpb25zLmRlYnVnKSB7XG4gICAgICAgIGlmIChjb25maWcub3B0aW9ucy5kZWJ1Zy5kYXRhICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5vcHRpb25zLmRlYnVnLmRhdGEgIT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLm9wdGlvbnMuZGVidWcuZGF0YVwiIHByb3BlcnR5IG11c3QgYmUgb2YgdHlwZSBib29sZWFuLicpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuY29uZmlnLm9wdGlvbnMuZGVidWcuZGF0YSA9IGNvbmZpZy5vcHRpb25zLmRlYnVnLmRhdGE7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29uZmlnLm9wdGlvbnMuZGVidWcucGFja2V0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5vcHRpb25zLmRlYnVnLnBhY2tldCAhPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJjb25maWcub3B0aW9ucy5kZWJ1Zy5wYWNrZXRcIiBwcm9wZXJ0eSBtdXN0IGJlIG9mIHR5cGUgYm9vbGVhbi4nKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmNvbmZpZy5vcHRpb25zLmRlYnVnLnBhY2tldCA9IGNvbmZpZy5vcHRpb25zLmRlYnVnLnBhY2tldDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb25maWcub3B0aW9ucy5kZWJ1Zy5wYXlsb2FkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5vcHRpb25zLmRlYnVnLnBheWxvYWQgIT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLm9wdGlvbnMuZGVidWcucGF5bG9hZFwiIHByb3BlcnR5IG11c3QgYmUgb2YgdHlwZSBib29sZWFuLicpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuY29uZmlnLm9wdGlvbnMuZGVidWcucGF5bG9hZCA9IGNvbmZpZy5vcHRpb25zLmRlYnVnLnBheWxvYWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29uZmlnLm9wdGlvbnMuZGVidWcudG9rZW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGlmICh0eXBlb2YgY29uZmlnLm9wdGlvbnMuZGVidWcudG9rZW4gIT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLm9wdGlvbnMuZGVidWcudG9rZW5cIiBwcm9wZXJ0eSBtdXN0IGJlIG9mIHR5cGUgYm9vbGVhbi4nKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmNvbmZpZy5vcHRpb25zLmRlYnVnLnRva2VuID0gY29uZmlnLm9wdGlvbnMuZGVidWcudG9rZW47XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGNvbmZpZy5vcHRpb25zLmVuYWJsZUFuc2lOdWxsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25maWcub3B0aW9ucy5lbmFibGVBbnNpTnVsbCAhPT0gJ2Jvb2xlYW4nICYmIGNvbmZpZy5vcHRpb25zLmVuYWJsZUFuc2lOdWxsICE9PSBudWxsKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLm9wdGlvbnMuZW5hYmxlQW5zaU51bGxcIiBwcm9wZXJ0eSBtdXN0IGJlIG9mIHR5cGUgYm9vbGVhbiBvciBudWxsLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb25maWcub3B0aW9ucy5lbmFibGVBbnNpTnVsbCA9IGNvbmZpZy5vcHRpb25zLmVuYWJsZUFuc2lOdWxsO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29uZmlnLm9wdGlvbnMuZW5hYmxlQW5zaU51bGxEZWZhdWx0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25maWcub3B0aW9ucy5lbmFibGVBbnNpTnVsbERlZmF1bHQgIT09ICdib29sZWFuJyAmJiBjb25maWcub3B0aW9ucy5lbmFibGVBbnNpTnVsbERlZmF1bHQgIT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJjb25maWcub3B0aW9ucy5lbmFibGVBbnNpTnVsbERlZmF1bHRcIiBwcm9wZXJ0eSBtdXN0IGJlIG9mIHR5cGUgYm9vbGVhbiBvciBudWxsLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb25maWcub3B0aW9ucy5lbmFibGVBbnNpTnVsbERlZmF1bHQgPSBjb25maWcub3B0aW9ucy5lbmFibGVBbnNpTnVsbERlZmF1bHQ7XG4gICAgICB9XG5cbiAgICAgIGlmIChjb25maWcub3B0aW9ucy5lbmFibGVBbnNpUGFkZGluZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uZmlnLm9wdGlvbnMuZW5hYmxlQW5zaVBhZGRpbmcgIT09ICdib29sZWFuJyAmJiBjb25maWcub3B0aW9ucy5lbmFibGVBbnNpUGFkZGluZyAhPT0gbnVsbCkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBcImNvbmZpZy5vcHRpb25zLmVuYWJsZUFuc2lQYWRkaW5nXCIgcHJvcGVydHkgbXVzdCBiZSBvZiB0eXBlIGJvb2xlYW4gb3IgbnVsbC4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29uZmlnLm9wdGlvbnMuZW5hYmxlQW5zaVBhZGRpbmcgPSBjb25maWcub3B0aW9ucy5lbmFibGVBbnNpUGFkZGluZztcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbmZpZy5vcHRpb25zLmVuYWJsZUFuc2lXYXJuaW5ncyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uZmlnLm9wdGlvbnMuZW5hYmxlQW5zaVdhcm5pbmdzICE9PSAnYm9vbGVhbicgJiYgY29uZmlnLm9wdGlvbnMuZW5hYmxlQW5zaVdhcm5pbmdzICE9PSBudWxsKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLm9wdGlvbnMuZW5hYmxlQW5zaVdhcm5pbmdzXCIgcHJvcGVydHkgbXVzdCBiZSBvZiB0eXBlIGJvb2xlYW4gb3IgbnVsbC4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29uZmlnLm9wdGlvbnMuZW5hYmxlQW5zaVdhcm5pbmdzID0gY29uZmlnLm9wdGlvbnMuZW5hYmxlQW5zaVdhcm5pbmdzO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29uZmlnLm9wdGlvbnMuZW5hYmxlQXJpdGhBYm9ydCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uZmlnLm9wdGlvbnMuZW5hYmxlQXJpdGhBYm9ydCAhPT0gJ2Jvb2xlYW4nICYmIGNvbmZpZy5vcHRpb25zLmVuYWJsZUFyaXRoQWJvcnQgIT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJjb25maWcub3B0aW9ucy5lbmFibGVBcml0aEFib3J0XCIgcHJvcGVydHkgbXVzdCBiZSBvZiB0eXBlIGJvb2xlYW4gb3IgbnVsbC4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29uZmlnLm9wdGlvbnMuZW5hYmxlQXJpdGhBYm9ydCA9IGNvbmZpZy5vcHRpb25zLmVuYWJsZUFyaXRoQWJvcnQ7XG4gICAgICB9XG5cbiAgICAgIGlmIChjb25maWcub3B0aW9ucy5lbmFibGVDb25jYXROdWxsWWllbGRzTnVsbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uZmlnLm9wdGlvbnMuZW5hYmxlQ29uY2F0TnVsbFlpZWxkc051bGwgIT09ICdib29sZWFuJyAmJiBjb25maWcub3B0aW9ucy5lbmFibGVDb25jYXROdWxsWWllbGRzTnVsbCAhPT0gbnVsbCkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBcImNvbmZpZy5vcHRpb25zLmVuYWJsZUNvbmNhdE51bGxZaWVsZHNOdWxsXCIgcHJvcGVydHkgbXVzdCBiZSBvZiB0eXBlIGJvb2xlYW4gb3IgbnVsbC4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29uZmlnLm9wdGlvbnMuZW5hYmxlQ29uY2F0TnVsbFlpZWxkc051bGwgPSBjb25maWcub3B0aW9ucy5lbmFibGVDb25jYXROdWxsWWllbGRzTnVsbDtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbmZpZy5vcHRpb25zLmVuYWJsZUN1cnNvckNsb3NlT25Db21taXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5vcHRpb25zLmVuYWJsZUN1cnNvckNsb3NlT25Db21taXQgIT09ICdib29sZWFuJyAmJiBjb25maWcub3B0aW9ucy5lbmFibGVDdXJzb3JDbG9zZU9uQ29tbWl0ICE9PSBudWxsKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLm9wdGlvbnMuZW5hYmxlQ3Vyc29yQ2xvc2VPbkNvbW1pdFwiIHByb3BlcnR5IG11c3QgYmUgb2YgdHlwZSBib29sZWFuIG9yIG51bGwuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbmZpZy5vcHRpb25zLmVuYWJsZUN1cnNvckNsb3NlT25Db21taXQgPSBjb25maWcub3B0aW9ucy5lbmFibGVDdXJzb3JDbG9zZU9uQ29tbWl0O1xuICAgICAgfVxuXG4gICAgICBpZiAoY29uZmlnLm9wdGlvbnMuZW5hYmxlSW1wbGljaXRUcmFuc2FjdGlvbnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5vcHRpb25zLmVuYWJsZUltcGxpY2l0VHJhbnNhY3Rpb25zICE9PSAnYm9vbGVhbicgJiYgY29uZmlnLm9wdGlvbnMuZW5hYmxlSW1wbGljaXRUcmFuc2FjdGlvbnMgIT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJjb25maWcub3B0aW9ucy5lbmFibGVJbXBsaWNpdFRyYW5zYWN0aW9uc1wiIHByb3BlcnR5IG11c3QgYmUgb2YgdHlwZSBib29sZWFuIG9yIG51bGwuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbmZpZy5vcHRpb25zLmVuYWJsZUltcGxpY2l0VHJhbnNhY3Rpb25zID0gY29uZmlnLm9wdGlvbnMuZW5hYmxlSW1wbGljaXRUcmFuc2FjdGlvbnM7XG4gICAgICB9XG5cbiAgICAgIGlmIChjb25maWcub3B0aW9ucy5lbmFibGVOdW1lcmljUm91bmRhYm9ydCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uZmlnLm9wdGlvbnMuZW5hYmxlTnVtZXJpY1JvdW5kYWJvcnQgIT09ICdib29sZWFuJyAmJiBjb25maWcub3B0aW9ucy5lbmFibGVOdW1lcmljUm91bmRhYm9ydCAhPT0gbnVsbCkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBcImNvbmZpZy5vcHRpb25zLmVuYWJsZU51bWVyaWNSb3VuZGFib3J0XCIgcHJvcGVydHkgbXVzdCBiZSBvZiB0eXBlIGJvb2xlYW4gb3IgbnVsbC4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29uZmlnLm9wdGlvbnMuZW5hYmxlTnVtZXJpY1JvdW5kYWJvcnQgPSBjb25maWcub3B0aW9ucy5lbmFibGVOdW1lcmljUm91bmRhYm9ydDtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbmZpZy5vcHRpb25zLmVuYWJsZVF1b3RlZElkZW50aWZpZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5vcHRpb25zLmVuYWJsZVF1b3RlZElkZW50aWZpZXIgIT09ICdib29sZWFuJyAmJiBjb25maWcub3B0aW9ucy5lbmFibGVRdW90ZWRJZGVudGlmaWVyICE9PSBudWxsKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLm9wdGlvbnMuZW5hYmxlUXVvdGVkSWRlbnRpZmllclwiIHByb3BlcnR5IG11c3QgYmUgb2YgdHlwZSBib29sZWFuIG9yIG51bGwuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbmZpZy5vcHRpb25zLmVuYWJsZVF1b3RlZElkZW50aWZpZXIgPSBjb25maWcub3B0aW9ucy5lbmFibGVRdW90ZWRJZGVudGlmaWVyO1xuICAgICAgfVxuICAgICAgaWYgKGNvbmZpZy5vcHRpb25zLmVuY3J5cHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5vcHRpb25zLmVuY3J5cHQgIT09ICdib29sZWFuJykge1xuICAgICAgICAgIGlmIChjb25maWcub3B0aW9ucy5lbmNyeXB0ICE9PSAnc3RyaWN0Jykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiZW5jcnlwdFwiIHByb3BlcnR5IG11c3QgYmUgc2V0IHRvIFwic3RyaWN0XCIsIG9yIG9mIHR5cGUgYm9vbGVhbi4nKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbmZpZy5vcHRpb25zLmVuY3J5cHQgPSBjb25maWcub3B0aW9ucy5lbmNyeXB0O1xuICAgICAgfVxuXG4gICAgICBpZiAoY29uZmlnLm9wdGlvbnMuZmFsbGJhY2tUb0RlZmF1bHREYiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uZmlnLm9wdGlvbnMuZmFsbGJhY2tUb0RlZmF1bHREYiAhPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLm9wdGlvbnMuZmFsbGJhY2tUb0RlZmF1bHREYlwiIHByb3BlcnR5IG11c3QgYmUgb2YgdHlwZSBib29sZWFuLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb25maWcub3B0aW9ucy5mYWxsYmFja1RvRGVmYXVsdERiID0gY29uZmlnLm9wdGlvbnMuZmFsbGJhY2tUb0RlZmF1bHREYjtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbmZpZy5vcHRpb25zLmluc3RhbmNlTmFtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uZmlnLm9wdGlvbnMuaW5zdGFuY2VOYW1lICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBcImNvbmZpZy5vcHRpb25zLmluc3RhbmNlTmFtZVwiIHByb3BlcnR5IG11c3QgYmUgb2YgdHlwZSBzdHJpbmcuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbmZpZy5vcHRpb25zLmluc3RhbmNlTmFtZSA9IGNvbmZpZy5vcHRpb25zLmluc3RhbmNlTmFtZTtcbiAgICAgICAgdGhpcy5jb25maWcub3B0aW9ucy5wb3J0ID0gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29uZmlnLm9wdGlvbnMuaXNvbGF0aW9uTGV2ZWwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBhc3NlcnRWYWxpZElzb2xhdGlvbkxldmVsKGNvbmZpZy5vcHRpb25zLmlzb2xhdGlvbkxldmVsLCAnY29uZmlnLm9wdGlvbnMuaXNvbGF0aW9uTGV2ZWwnKTtcblxuICAgICAgICB0aGlzLmNvbmZpZy5vcHRpb25zLmlzb2xhdGlvbkxldmVsID0gY29uZmlnLm9wdGlvbnMuaXNvbGF0aW9uTGV2ZWw7XG4gICAgICB9XG5cbiAgICAgIGlmIChjb25maWcub3B0aW9ucy5sYW5ndWFnZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uZmlnLm9wdGlvbnMubGFuZ3VhZ2UgIT09ICdzdHJpbmcnICYmIGNvbmZpZy5vcHRpb25zLmxhbmd1YWdlICE9PSBudWxsKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLm9wdGlvbnMubGFuZ3VhZ2VcIiBwcm9wZXJ0eSBtdXN0IGJlIG9mIHR5cGUgc3RyaW5nIG9yIG51bGwuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbmZpZy5vcHRpb25zLmxhbmd1YWdlID0gY29uZmlnLm9wdGlvbnMubGFuZ3VhZ2U7XG4gICAgICB9XG5cbiAgICAgIGlmIChjb25maWcub3B0aW9ucy5sb2NhbEFkZHJlc3MgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5vcHRpb25zLmxvY2FsQWRkcmVzcyAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJjb25maWcub3B0aW9ucy5sb2NhbEFkZHJlc3NcIiBwcm9wZXJ0eSBtdXN0IGJlIG9mIHR5cGUgc3RyaW5nLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb25maWcub3B0aW9ucy5sb2NhbEFkZHJlc3MgPSBjb25maWcub3B0aW9ucy5sb2NhbEFkZHJlc3M7XG4gICAgICB9XG5cbiAgICAgIGlmIChjb25maWcub3B0aW9ucy5tdWx0aVN1Ym5ldEZhaWxvdmVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25maWcub3B0aW9ucy5tdWx0aVN1Ym5ldEZhaWxvdmVyICE9PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJjb25maWcub3B0aW9ucy5tdWx0aVN1Ym5ldEZhaWxvdmVyXCIgcHJvcGVydHkgbXVzdCBiZSBvZiB0eXBlIGJvb2xlYW4uJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbmZpZy5vcHRpb25zLm11bHRpU3VibmV0RmFpbG92ZXIgPSBjb25maWcub3B0aW9ucy5tdWx0aVN1Ym5ldEZhaWxvdmVyO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29uZmlnLm9wdGlvbnMucGFja2V0U2l6ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uZmlnLm9wdGlvbnMucGFja2V0U2l6ZSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJjb25maWcub3B0aW9ucy5wYWNrZXRTaXplXCIgcHJvcGVydHkgbXVzdCBiZSBvZiB0eXBlIG51bWJlci4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29uZmlnLm9wdGlvbnMucGFja2V0U2l6ZSA9IGNvbmZpZy5vcHRpb25zLnBhY2tldFNpemU7XG4gICAgICB9XG5cbiAgICAgIGlmIChjb25maWcub3B0aW9ucy5wb3J0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25maWcub3B0aW9ucy5wb3J0ICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBcImNvbmZpZy5vcHRpb25zLnBvcnRcIiBwcm9wZXJ0eSBtdXN0IGJlIG9mIHR5cGUgbnVtYmVyLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbmZpZy5vcHRpb25zLnBvcnQgPD0gMCB8fCBjb25maWcub3B0aW9ucy5wb3J0ID49IDY1NTM2KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RoZSBcImNvbmZpZy5vcHRpb25zLnBvcnRcIiBwcm9wZXJ0eSBtdXN0IGJlID4gMCBhbmQgPCA2NTUzNicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb25maWcub3B0aW9ucy5wb3J0ID0gY29uZmlnLm9wdGlvbnMucG9ydDtcbiAgICAgICAgdGhpcy5jb25maWcub3B0aW9ucy5pbnN0YW5jZU5hbWUgPSB1bmRlZmluZWQ7XG4gICAgICB9XG5cbiAgICAgIGlmIChjb25maWcub3B0aW9ucy5yZWFkT25seUludGVudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uZmlnLm9wdGlvbnMucmVhZE9ubHlJbnRlbnQgIT09ICdib29sZWFuJykge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBcImNvbmZpZy5vcHRpb25zLnJlYWRPbmx5SW50ZW50XCIgcHJvcGVydHkgbXVzdCBiZSBvZiB0eXBlIGJvb2xlYW4uJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbmZpZy5vcHRpb25zLnJlYWRPbmx5SW50ZW50ID0gY29uZmlnLm9wdGlvbnMucmVhZE9ubHlJbnRlbnQ7XG4gICAgICB9XG5cbiAgICAgIGlmIChjb25maWcub3B0aW9ucy5yZXF1ZXN0VGltZW91dCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uZmlnLm9wdGlvbnMucmVxdWVzdFRpbWVvdXQgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLm9wdGlvbnMucmVxdWVzdFRpbWVvdXRcIiBwcm9wZXJ0eSBtdXN0IGJlIG9mIHR5cGUgbnVtYmVyLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb25maWcub3B0aW9ucy5yZXF1ZXN0VGltZW91dCA9IGNvbmZpZy5vcHRpb25zLnJlcXVlc3RUaW1lb3V0O1xuICAgICAgfVxuXG4gICAgICBpZiAoY29uZmlnLm9wdGlvbnMubWF4UmV0cmllc09uVHJhbnNpZW50RXJyb3JzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25maWcub3B0aW9ucy5tYXhSZXRyaWVzT25UcmFuc2llbnRFcnJvcnMgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLm9wdGlvbnMubWF4UmV0cmllc09uVHJhbnNpZW50RXJyb3JzXCIgcHJvcGVydHkgbXVzdCBiZSBvZiB0eXBlIG51bWJlci4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb25maWcub3B0aW9ucy5tYXhSZXRyaWVzT25UcmFuc2llbnRFcnJvcnMgPCAwKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLm9wdGlvbnMubWF4UmV0cmllc09uVHJhbnNpZW50RXJyb3JzXCIgcHJvcGVydHkgbXVzdCBiZSBlcXVhbCBvciBncmVhdGVyIHRoYW4gMC4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29uZmlnLm9wdGlvbnMubWF4UmV0cmllc09uVHJhbnNpZW50RXJyb3JzID0gY29uZmlnLm9wdGlvbnMubWF4UmV0cmllc09uVHJhbnNpZW50RXJyb3JzO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29uZmlnLm9wdGlvbnMuY29ubmVjdGlvblJldHJ5SW50ZXJ2YWwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5vcHRpb25zLmNvbm5lY3Rpb25SZXRyeUludGVydmFsICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBcImNvbmZpZy5vcHRpb25zLmNvbm5lY3Rpb25SZXRyeUludGVydmFsXCIgcHJvcGVydHkgbXVzdCBiZSBvZiB0eXBlIG51bWJlci4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb25maWcub3B0aW9ucy5jb25uZWN0aW9uUmV0cnlJbnRlcnZhbCA8PSAwKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLm9wdGlvbnMuY29ubmVjdGlvblJldHJ5SW50ZXJ2YWxcIiBwcm9wZXJ0eSBtdXN0IGJlIGdyZWF0ZXIgdGhhbiAwLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb25maWcub3B0aW9ucy5jb25uZWN0aW9uUmV0cnlJbnRlcnZhbCA9IGNvbmZpZy5vcHRpb25zLmNvbm5lY3Rpb25SZXRyeUludGVydmFsO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29uZmlnLm9wdGlvbnMucm93Q29sbGVjdGlvbk9uRG9uZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uZmlnLm9wdGlvbnMucm93Q29sbGVjdGlvbk9uRG9uZSAhPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLm9wdGlvbnMucm93Q29sbGVjdGlvbk9uRG9uZVwiIHByb3BlcnR5IG11c3QgYmUgb2YgdHlwZSBib29sZWFuLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb25maWcub3B0aW9ucy5yb3dDb2xsZWN0aW9uT25Eb25lID0gY29uZmlnLm9wdGlvbnMucm93Q29sbGVjdGlvbk9uRG9uZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbmZpZy5vcHRpb25zLnJvd0NvbGxlY3Rpb25PblJlcXVlc3RDb21wbGV0aW9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25maWcub3B0aW9ucy5yb3dDb2xsZWN0aW9uT25SZXF1ZXN0Q29tcGxldGlvbiAhPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLm9wdGlvbnMucm93Q29sbGVjdGlvbk9uUmVxdWVzdENvbXBsZXRpb25cIiBwcm9wZXJ0eSBtdXN0IGJlIG9mIHR5cGUgYm9vbGVhbi4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29uZmlnLm9wdGlvbnMucm93Q29sbGVjdGlvbk9uUmVxdWVzdENvbXBsZXRpb24gPSBjb25maWcub3B0aW9ucy5yb3dDb2xsZWN0aW9uT25SZXF1ZXN0Q29tcGxldGlvbjtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbmZpZy5vcHRpb25zLnRkc1ZlcnNpb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5vcHRpb25zLnRkc1ZlcnNpb24gIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLm9wdGlvbnMudGRzVmVyc2lvblwiIHByb3BlcnR5IG11c3QgYmUgb2YgdHlwZSBzdHJpbmcuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbmZpZy5vcHRpb25zLnRkc1ZlcnNpb24gPSBjb25maWcub3B0aW9ucy50ZHNWZXJzaW9uO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29uZmlnLm9wdGlvbnMudGV4dHNpemUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5vcHRpb25zLnRleHRzaXplICE9PSAnbnVtYmVyJyAmJiBjb25maWcub3B0aW9ucy50ZXh0c2l6ZSAhPT0gbnVsbCkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBcImNvbmZpZy5vcHRpb25zLnRleHRzaXplXCIgcHJvcGVydHkgbXVzdCBiZSBvZiB0eXBlIG51bWJlciBvciBudWxsLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbmZpZy5vcHRpb25zLnRleHRzaXplID4gMjE0NzQ4MzY0Nykge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBcImNvbmZpZy5vcHRpb25zLnRleHRzaXplXCIgY2FuXFwndCBiZSBncmVhdGVyIHRoYW4gMjE0NzQ4MzY0Ny4nKTtcbiAgICAgICAgfSBlbHNlIGlmIChjb25maWcub3B0aW9ucy50ZXh0c2l6ZSA8IC0xKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLm9wdGlvbnMudGV4dHNpemVcIiBjYW5cXCd0IGJlIHNtYWxsZXIgdGhhbiAtMS4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29uZmlnLm9wdGlvbnMudGV4dHNpemUgPSBjb25maWcub3B0aW9ucy50ZXh0c2l6ZSB8IDA7XG4gICAgICB9XG5cbiAgICAgIGlmIChjb25maWcub3B0aW9ucy50cnVzdFNlcnZlckNlcnRpZmljYXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25maWcub3B0aW9ucy50cnVzdFNlcnZlckNlcnRpZmljYXRlICE9PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJjb25maWcub3B0aW9ucy50cnVzdFNlcnZlckNlcnRpZmljYXRlXCIgcHJvcGVydHkgbXVzdCBiZSBvZiB0eXBlIGJvb2xlYW4uJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbmZpZy5vcHRpb25zLnRydXN0U2VydmVyQ2VydGlmaWNhdGUgPSBjb25maWcub3B0aW9ucy50cnVzdFNlcnZlckNlcnRpZmljYXRlO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29uZmlnLm9wdGlvbnMuc2VydmVyTmFtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uZmlnLm9wdGlvbnMuc2VydmVyTmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJjb25maWcub3B0aW9ucy5zZXJ2ZXJOYW1lXCIgcHJvcGVydHkgbXVzdCBiZSBvZiB0eXBlIHN0cmluZy4nKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNvbmZpZy5vcHRpb25zLnNlcnZlck5hbWUgPSBjb25maWcub3B0aW9ucy5zZXJ2ZXJOYW1lO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29uZmlnLm9wdGlvbnMudXNlQ29sdW1uTmFtZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5vcHRpb25zLnVzZUNvbHVtbk5hbWVzICE9PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJjb25maWcub3B0aW9ucy51c2VDb2x1bW5OYW1lc1wiIHByb3BlcnR5IG11c3QgYmUgb2YgdHlwZSBib29sZWFuLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb25maWcub3B0aW9ucy51c2VDb2x1bW5OYW1lcyA9IGNvbmZpZy5vcHRpb25zLnVzZUNvbHVtbk5hbWVzO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29uZmlnLm9wdGlvbnMudXNlVVRDICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25maWcub3B0aW9ucy51c2VVVEMgIT09ICdib29sZWFuJykge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBcImNvbmZpZy5vcHRpb25zLnVzZVVUQ1wiIHByb3BlcnR5IG11c3QgYmUgb2YgdHlwZSBib29sZWFuLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb25maWcub3B0aW9ucy51c2VVVEMgPSBjb25maWcub3B0aW9ucy51c2VVVEM7XG4gICAgICB9XG5cbiAgICAgIGlmIChjb25maWcub3B0aW9ucy53b3Jrc3RhdGlvbklkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25maWcub3B0aW9ucy53b3Jrc3RhdGlvbklkICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBcImNvbmZpZy5vcHRpb25zLndvcmtzdGF0aW9uSWRcIiBwcm9wZXJ0eSBtdXN0IGJlIG9mIHR5cGUgc3RyaW5nLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb25maWcub3B0aW9ucy53b3Jrc3RhdGlvbklkID0gY29uZmlnLm9wdGlvbnMud29ya3N0YXRpb25JZDtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbmZpZy5vcHRpb25zLmxvd2VyQ2FzZUd1aWRzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25maWcub3B0aW9ucy5sb3dlckNhc2VHdWlkcyAhPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiY29uZmlnLm9wdGlvbnMubG93ZXJDYXNlR3VpZHNcIiBwcm9wZXJ0eSBtdXN0IGJlIG9mIHR5cGUgYm9vbGVhbi4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29uZmlnLm9wdGlvbnMubG93ZXJDYXNlR3VpZHMgPSBjb25maWcub3B0aW9ucy5sb3dlckNhc2VHdWlkcztcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnNlY3VyZUNvbnRleHRPcHRpb25zID0gdGhpcy5jb25maWcub3B0aW9ucy5jcnlwdG9DcmVkZW50aWFsc0RldGFpbHM7XG4gICAgaWYgKHRoaXMuc2VjdXJlQ29udGV4dE9wdGlvbnMuc2VjdXJlT3B0aW9ucyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBJZiB0aGUgY2FsbGVyIGhhcyBub3Qgc3BlY2lmaWVkIHRoZWlyIG93biBgc2VjdXJlT3B0aW9uc2AsXG4gICAgICAvLyB3ZSBzZXQgYFNTTF9PUF9ET05UX0lOU0VSVF9FTVBUWV9GUkFHTUVOVFNgIGhlcmUuXG4gICAgICAvLyBPbGRlciBTUUwgU2VydmVyIGluc3RhbmNlcyBydW5uaW5nIG9uIG9sZGVyIFdpbmRvd3MgdmVyc2lvbnMgaGF2ZVxuICAgICAgLy8gdHJvdWJsZSB3aXRoIHRoZSBCRUFTVCB3b3JrYXJvdW5kIGluIE9wZW5TU0wuXG4gICAgICAvLyBBcyBCRUFTVCBpcyBhIGJyb3dzZXIgc3BlY2lmaWMgZXhwbG9pdCwgd2UgY2FuIGp1c3QgZGlzYWJsZSB0aGlzIG9wdGlvbiBoZXJlLlxuICAgICAgdGhpcy5zZWN1cmVDb250ZXh0T3B0aW9ucyA9IE9iamVjdC5jcmVhdGUodGhpcy5zZWN1cmVDb250ZXh0T3B0aW9ucywge1xuICAgICAgICBzZWN1cmVPcHRpb25zOiB7XG4gICAgICAgICAgdmFsdWU6IGNvbnN0YW50cy5TU0xfT1BfRE9OVF9JTlNFUlRfRU1QVFlfRlJBR01FTlRTXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMuZGVidWcgPSB0aGlzLmNyZWF0ZURlYnVnKCk7XG4gICAgdGhpcy5pblRyYW5zYWN0aW9uID0gZmFsc2U7XG4gICAgdGhpcy50cmFuc2FjdGlvbkRlc2NyaXB0b3JzID0gW0J1ZmZlci5mcm9tKFswLCAwLCAwLCAwLCAwLCAwLCAwLCAwXSldO1xuXG4gICAgLy8gJ2JlZ2luVHJhbnNhY3Rpb24nLCAnY29tbWl0VHJhbnNhY3Rpb24nIGFuZCAncm9sbGJhY2tUcmFuc2FjdGlvbidcbiAgICAvLyBldmVudHMgYXJlIHV0aWxpemVkIHRvIG1haW50YWluIGluVHJhbnNhY3Rpb24gcHJvcGVydHkgc3RhdGUgd2hpY2ggaW5cbiAgICAvLyB0dXJuIGlzIHVzZWQgaW4gbWFuYWdpbmcgdHJhbnNhY3Rpb25zLiBUaGVzZSBldmVudHMgYXJlIG9ubHkgZmlyZWQgZm9yXG4gICAgLy8gVERTIHZlcnNpb24gNy4yIGFuZCBiZXlvbmQuIFRoZSBwcm9wZXJ0aWVzIGJlbG93IGFyZSB1c2VkIHRvIGVtdWxhdGVcbiAgICAvLyBlcXVpdmFsZW50IGJlaGF2aW9yIGZvciBURFMgdmVyc2lvbnMgYmVmb3JlIDcuMi5cbiAgICB0aGlzLnRyYW5zYWN0aW9uRGVwdGggPSAwO1xuICAgIHRoaXMuaXNTcWxCYXRjaCA9IGZhbHNlO1xuICAgIHRoaXMuY2xvc2VkID0gZmFsc2U7XG4gICAgdGhpcy5tZXNzYWdlQnVmZmVyID0gQnVmZmVyLmFsbG9jKDApO1xuXG4gICAgdGhpcy5jdXJUcmFuc2llbnRSZXRyeUNvdW50ID0gMDtcbiAgICB0aGlzLnRyYW5zaWVudEVycm9yTG9va3VwID0gbmV3IFRyYW5zaWVudEVycm9yTG9va3VwKCk7XG5cbiAgICB0aGlzLnN0YXRlID0gdGhpcy5TVEFURS5JTklUSUFMSVpFRDtcblxuICAgIHRoaXMuX2NhbmNlbEFmdGVyUmVxdWVzdFNlbnQgPSAoKSA9PiB7XG4gICAgICB0aGlzLm1lc3NhZ2VJby5zZW5kTWVzc2FnZShUWVBFLkFUVEVOVElPTik7XG4gICAgICB0aGlzLmNyZWF0ZUNhbmNlbFRpbWVyKCk7XG4gICAgfTtcbiAgfVxuXG4gIGNvbm5lY3QoY29ubmVjdExpc3RlbmVyPzogKGVycj86IEVycm9yKSA9PiB2b2lkKSB7XG4gICAgaWYgKHRoaXMuc3RhdGUgIT09IHRoaXMuU1RBVEUuSU5JVElBTElaRUQpIHtcbiAgICAgIHRocm93IG5ldyBDb25uZWN0aW9uRXJyb3IoJ2AuY29ubmVjdGAgY2FuIG5vdCBiZSBjYWxsZWQgb24gYSBDb25uZWN0aW9uIGluIGAnICsgdGhpcy5zdGF0ZS5uYW1lICsgJ2Agc3RhdGUuJyk7XG4gICAgfVxuXG4gICAgaWYgKGNvbm5lY3RMaXN0ZW5lcikge1xuICAgICAgY29uc3Qgb25Db25uZWN0ID0gKGVycj86IEVycm9yKSA9PiB7XG4gICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoJ2Vycm9yJywgb25FcnJvcik7XG4gICAgICAgIGNvbm5lY3RMaXN0ZW5lcihlcnIpO1xuICAgICAgfTtcblxuICAgICAgY29uc3Qgb25FcnJvciA9IChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoJ2Nvbm5lY3QnLCBvbkNvbm5lY3QpO1xuICAgICAgICBjb25uZWN0TGlzdGVuZXIoZXJyKTtcbiAgICAgIH07XG5cbiAgICAgIHRoaXMub25jZSgnY29ubmVjdCcsIG9uQ29ubmVjdCk7XG4gICAgICB0aGlzLm9uY2UoJ2Vycm9yJywgb25FcnJvcik7XG4gICAgfVxuXG4gICAgdGhpcy50cmFuc2l0aW9uVG8odGhpcy5TVEFURS5DT05ORUNUSU5HKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgc2VydmVyIGhhcyByZXBvcnRlZCB0aGF0IHRoZSBjaGFyc2V0IGhhcyBjaGFuZ2VkLlxuICAgKi9cbiAgb24oZXZlbnQ6ICdjaGFyc2V0Q2hhbmdlJywgbGlzdGVuZXI6IChjaGFyc2V0OiBzdHJpbmcpID0+IHZvaWQpOiB0aGlzXG5cbiAgLyoqXG4gICAqIFRoZSBhdHRlbXB0IHRvIGNvbm5lY3QgYW5kIHZhbGlkYXRlIGhhcyBjb21wbGV0ZWQuXG4gICAqL1xuICBvbihcbiAgICBldmVudDogJ2Nvbm5lY3QnLFxuICAgIC8qKlxuICAgICAqIEBwYXJhbSBlcnIgSWYgc3VjY2Vzc2Z1bGx5IGNvbm5lY3RlZCwgd2lsbCBiZSBmYWxzZXkuIElmIHRoZXJlIHdhcyBhXG4gICAgICogICBwcm9ibGVtICh3aXRoIGVpdGhlciBjb25uZWN0aW5nIG9yIHZhbGlkYXRpb24pLCB3aWxsIGJlIGFuIFtbRXJyb3JdXSBvYmplY3QuXG4gICAgICovXG4gICAgbGlzdGVuZXI6IChlcnI6IEVycm9yIHwgdW5kZWZpbmVkKSA9PiB2b2lkXG4gICk6IHRoaXNcblxuICAvKipcbiAgICogVGhlIHNlcnZlciBoYXMgcmVwb3J0ZWQgdGhhdCB0aGUgYWN0aXZlIGRhdGFiYXNlIGhhcyBjaGFuZ2VkLlxuICAgKiBUaGlzIG1heSBiZSBhcyBhIHJlc3VsdCBvZiBhIHN1Y2Nlc3NmdWwgbG9naW4sIG9yIGEgYHVzZWAgc3RhdGVtZW50LlxuICAgKi9cbiAgb24oZXZlbnQ6ICdkYXRhYmFzZUNoYW5nZScsIGxpc3RlbmVyOiAoZGF0YWJhc2VOYW1lOiBzdHJpbmcpID0+IHZvaWQpOiB0aGlzXG5cbiAgLyoqXG4gICAqIEEgZGVidWcgbWVzc2FnZSBpcyBhdmFpbGFibGUuIEl0IG1heSBiZSBsb2dnZWQgb3IgaWdub3JlZC5cbiAgICovXG4gIG9uKGV2ZW50OiAnZGVidWcnLCBsaXN0ZW5lcjogKG1lc3NhZ2VUZXh0OiBzdHJpbmcpID0+IHZvaWQpOiB0aGlzXG5cbiAgLyoqXG4gICAqIEludGVybmFsIGVycm9yIG9jY3Vycy5cbiAgICovXG4gIG9uKGV2ZW50OiAnZXJyb3InLCBsaXN0ZW5lcjogKGVycjogRXJyb3IpID0+IHZvaWQpOiB0aGlzXG5cbiAgLyoqXG4gICAqIFRoZSBzZXJ2ZXIgaGFzIGlzc3VlZCBhbiBlcnJvciBtZXNzYWdlLlxuICAgKi9cbiAgb24oZXZlbnQ6ICdlcnJvck1lc3NhZ2UnLCBsaXN0ZW5lcjogKG1lc3NhZ2U6IGltcG9ydCgnLi90b2tlbi90b2tlbicpLkVycm9yTWVzc2FnZVRva2VuKSA9PiB2b2lkKTogdGhpc1xuXG4gIC8qKlxuICAgKiBUaGUgY29ubmVjdGlvbiBoYXMgZW5kZWQuXG4gICAqXG4gICAqIFRoaXMgbWF5IGJlIGFzIGEgcmVzdWx0IG9mIHRoZSBjbGllbnQgY2FsbGluZyBbW2Nsb3NlXV0sIHRoZSBzZXJ2ZXJcbiAgICogY2xvc2luZyB0aGUgY29ubmVjdGlvbiwgb3IgYSBuZXR3b3JrIGVycm9yLlxuICAgKi9cbiAgb24oZXZlbnQ6ICdlbmQnLCBsaXN0ZW5lcjogKCkgPT4gdm9pZCk6IHRoaXNcblxuICAvKipcbiAgICogVGhlIHNlcnZlciBoYXMgaXNzdWVkIGFuIGluZm9ybWF0aW9uIG1lc3NhZ2UuXG4gICAqL1xuICBvbihldmVudDogJ2luZm9NZXNzYWdlJywgbGlzdGVuZXI6IChtZXNzYWdlOiBpbXBvcnQoJy4vdG9rZW4vdG9rZW4nKS5JbmZvTWVzc2FnZVRva2VuKSA9PiB2b2lkKTogdGhpc1xuXG4gIC8qKlxuICAgKiBUaGUgc2VydmVyIGhhcyByZXBvcnRlZCB0aGF0IHRoZSBsYW5ndWFnZSBoYXMgY2hhbmdlZC5cbiAgICovXG4gIG9uKGV2ZW50OiAnbGFuZ3VhZ2VDaGFuZ2UnLCBsaXN0ZW5lcjogKGxhbmd1YWdlTmFtZTogc3RyaW5nKSA9PiB2b2lkKTogdGhpc1xuXG4gIC8qKlxuICAgKiBUaGUgY29ubmVjdGlvbiB3YXMgcmVzZXQuXG4gICAqL1xuICBvbihldmVudDogJ3Jlc2V0Q29ubmVjdGlvbicsIGxpc3RlbmVyOiAoKSA9PiB2b2lkKTogdGhpc1xuXG4gIC8qKlxuICAgKiBBIHNlY3VyZSBjb25uZWN0aW9uIGhhcyBiZWVuIGVzdGFibGlzaGVkLlxuICAgKi9cbiAgb24oZXZlbnQ6ICdzZWN1cmUnLCBsaXN0ZW5lcjogKGNsZWFydGV4dDogaW1wb3J0KCd0bHMnKS5UTFNTb2NrZXQpID0+IHZvaWQpOiB0aGlzXG5cbiAgb24oZXZlbnQ6IHN0cmluZyB8IHN5bWJvbCwgbGlzdGVuZXI6ICguLi5hcmdzOiBhbnlbXSkgPT4gdm9pZCkge1xuICAgIHJldHVybiBzdXBlci5vbihldmVudCwgbGlzdGVuZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBlbWl0KGV2ZW50OiAnY2hhcnNldENoYW5nZScsIGNoYXJzZXQ6IHN0cmluZyk6IGJvb2xlYW5cbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBlbWl0KGV2ZW50OiAnY29ubmVjdCcsIGVycm9yPzogRXJyb3IpOiBib29sZWFuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZW1pdChldmVudDogJ2RhdGFiYXNlQ2hhbmdlJywgZGF0YWJhc2VOYW1lOiBzdHJpbmcpOiBib29sZWFuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZW1pdChldmVudDogJ2RlYnVnJywgbWVzc2FnZVRleHQ6IHN0cmluZyk6IGJvb2xlYW5cbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBlbWl0KGV2ZW50OiAnZXJyb3InLCBlcnJvcjogRXJyb3IpOiBib29sZWFuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZW1pdChldmVudDogJ2Vycm9yTWVzc2FnZScsIG1lc3NhZ2U6IGltcG9ydCgnLi90b2tlbi90b2tlbicpLkVycm9yTWVzc2FnZVRva2VuKTogYm9vbGVhblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGVtaXQoZXZlbnQ6ICdlbmQnKTogYm9vbGVhblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGVtaXQoZXZlbnQ6ICdpbmZvTWVzc2FnZScsIG1lc3NhZ2U6IGltcG9ydCgnLi90b2tlbi90b2tlbicpLkluZm9NZXNzYWdlVG9rZW4pOiBib29sZWFuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZW1pdChldmVudDogJ2xhbmd1YWdlQ2hhbmdlJywgbGFuZ3VhZ2VOYW1lOiBzdHJpbmcpOiBib29sZWFuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZW1pdChldmVudDogJ3NlY3VyZScsIGNsZWFydGV4dDogaW1wb3J0KCd0bHMnKS5UTFNTb2NrZXQpOiBib29sZWFuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZW1pdChldmVudDogJ3Jlcm91dGluZycpOiBib29sZWFuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZW1pdChldmVudDogJ3Jlc2V0Q29ubmVjdGlvbicpOiBib29sZWFuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZW1pdChldmVudDogJ3JldHJ5Jyk6IGJvb2xlYW5cbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBlbWl0KGV2ZW50OiAncm9sbGJhY2tUcmFuc2FjdGlvbicpOiBib29sZWFuXG5cbiAgZW1pdChldmVudDogc3RyaW5nIHwgc3ltYm9sLCAuLi5hcmdzOiBhbnlbXSkge1xuICAgIHJldHVybiBzdXBlci5lbWl0KGV2ZW50LCAuLi5hcmdzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbG9zZXMgdGhlIGNvbm5lY3Rpb24gdG8gdGhlIGRhdGFiYXNlLlxuICAgKlxuICAgKiBUaGUgW1tFdmVudF9lbmRdXSB3aWxsIGJlIGVtaXR0ZWQgb25jZSB0aGUgY29ubmVjdGlvbiBoYXMgYmVlbiBjbG9zZWQuXG4gICAqL1xuICBjbG9zZSgpIHtcbiAgICB0aGlzLnRyYW5zaXRpb25Ubyh0aGlzLlNUQVRFLkZJTkFMKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgaW5pdGlhbGlzZUNvbm5lY3Rpb24oKSB7XG4gICAgY29uc3Qgc2lnbmFsID0gdGhpcy5jcmVhdGVDb25uZWN0VGltZXIoKTtcblxuICAgIGlmICh0aGlzLmNvbmZpZy5vcHRpb25zLnBvcnQpIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbm5lY3RPblBvcnQodGhpcy5jb25maWcub3B0aW9ucy5wb3J0LCB0aGlzLmNvbmZpZy5vcHRpb25zLm11bHRpU3VibmV0RmFpbG92ZXIsIHNpZ25hbCwgdGhpcy5jb25maWcub3B0aW9ucy5jb25uZWN0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gaW5zdGFuY2VMb29rdXAoe1xuICAgICAgICBzZXJ2ZXI6IHRoaXMuY29uZmlnLnNlcnZlcixcbiAgICAgICAgaW5zdGFuY2VOYW1lOiB0aGlzLmNvbmZpZy5vcHRpb25zLmluc3RhbmNlTmFtZSEsXG4gICAgICAgIHRpbWVvdXQ6IHRoaXMuY29uZmlnLm9wdGlvbnMuY29ubmVjdFRpbWVvdXQsXG4gICAgICAgIHNpZ25hbDogc2lnbmFsXG4gICAgICB9KS50aGVuKChwb3J0KSA9PiB7XG4gICAgICAgIHByb2Nlc3MubmV4dFRpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuY29ubmVjdE9uUG9ydChwb3J0LCB0aGlzLmNvbmZpZy5vcHRpb25zLm11bHRpU3VibmV0RmFpbG92ZXIsIHNpZ25hbCwgdGhpcy5jb25maWcub3B0aW9ucy5jb25uZWN0b3IpO1xuICAgICAgICB9KTtcbiAgICAgIH0sIChlcnIpID0+IHtcbiAgICAgICAgdGhpcy5jbGVhckNvbm5lY3RUaW1lcigpO1xuXG4gICAgICAgIGlmIChzaWduYWwuYWJvcnRlZCkge1xuICAgICAgICAgIC8vIElnbm9yZSB0aGUgQWJvcnRFcnJvciBmb3Igbm93LCB0aGlzIGlzIHN0aWxsIGhhbmRsZWQgYnkgdGhlIGNvbm5lY3RUaW1lciBmaXJpbmdcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBwcm9jZXNzLm5leHRUaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmVtaXQoJ2Nvbm5lY3QnLCBuZXcgQ29ubmVjdGlvbkVycm9yKGVyci5tZXNzYWdlLCAnRUlOU1RMT09LVVAnKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBjbGVhbnVwQ29ubmVjdGlvbihjbGVhbnVwVHlwZTogdHlwZW9mIENMRUFOVVBfVFlQRVtrZXlvZiB0eXBlb2YgQ0xFQU5VUF9UWVBFXSkge1xuICAgIGlmICghdGhpcy5jbG9zZWQpIHtcbiAgICAgIHRoaXMuY2xlYXJDb25uZWN0VGltZXIoKTtcbiAgICAgIHRoaXMuY2xlYXJSZXF1ZXN0VGltZXIoKTtcbiAgICAgIHRoaXMuY2xlYXJSZXRyeVRpbWVyKCk7XG4gICAgICB0aGlzLmNsb3NlQ29ubmVjdGlvbigpO1xuICAgICAgaWYgKGNsZWFudXBUeXBlID09PSBDTEVBTlVQX1RZUEUuUkVESVJFQ1QpIHtcbiAgICAgICAgdGhpcy5lbWl0KCdyZXJvdXRpbmcnKTtcbiAgICAgIH0gZWxzZSBpZiAoY2xlYW51cFR5cGUgIT09IENMRUFOVVBfVFlQRS5SRVRSWSkge1xuICAgICAgICBwcm9jZXNzLm5leHRUaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmVtaXQoJ2VuZCcpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVxdWVzdCA9IHRoaXMucmVxdWVzdDtcbiAgICAgIGlmIChyZXF1ZXN0KSB7XG4gICAgICAgIGNvbnN0IGVyciA9IG5ldyBSZXF1ZXN0RXJyb3IoJ0Nvbm5lY3Rpb24gY2xvc2VkIGJlZm9yZSByZXF1ZXN0IGNvbXBsZXRlZC4nLCAnRUNMT1NFJyk7XG4gICAgICAgIHJlcXVlc3QuY2FsbGJhY2soZXJyKTtcbiAgICAgICAgdGhpcy5yZXF1ZXN0ID0gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmNsb3NlZCA9IHRydWU7XG4gICAgICB0aGlzLmxvZ2luRXJyb3IgPSB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBjcmVhdGVEZWJ1ZygpIHtcbiAgICBjb25zdCBkZWJ1ZyA9IG5ldyBEZWJ1Zyh0aGlzLmNvbmZpZy5vcHRpb25zLmRlYnVnKTtcbiAgICBkZWJ1Zy5vbignZGVidWcnLCAobWVzc2FnZSkgPT4ge1xuICAgICAgdGhpcy5lbWl0KCdkZWJ1ZycsIG1lc3NhZ2UpO1xuICAgIH0pO1xuICAgIHJldHVybiBkZWJ1ZztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgY3JlYXRlVG9rZW5TdHJlYW1QYXJzZXIobWVzc2FnZTogTWVzc2FnZSwgaGFuZGxlcjogVG9rZW5IYW5kbGVyKSB7XG4gICAgcmV0dXJuIG5ldyBUb2tlblN0cmVhbVBhcnNlcihtZXNzYWdlLCB0aGlzLmRlYnVnLCBoYW5kbGVyLCB0aGlzLmNvbmZpZy5vcHRpb25zKTtcbiAgfVxuXG4gIHNvY2tldEhhbmRsaW5nRm9yU2VuZFByZUxvZ2luKHNvY2tldDogbmV0LlNvY2tldCkge1xuICAgIHNvY2tldC5vbignZXJyb3InLCAoZXJyb3IpID0+IHsgdGhpcy5zb2NrZXRFcnJvcihlcnJvcik7IH0pO1xuICAgIHNvY2tldC5vbignY2xvc2UnLCAoKSA9PiB7IHRoaXMuc29ja2V0Q2xvc2UoKTsgfSk7XG4gICAgc29ja2V0Lm9uKCdlbmQnLCAoKSA9PiB7IHRoaXMuc29ja2V0RW5kKCk7IH0pO1xuICAgIHNvY2tldC5zZXRLZWVwQWxpdmUodHJ1ZSwgS0VFUF9BTElWRV9JTklUSUFMX0RFTEFZKTtcblxuICAgIHRoaXMubWVzc2FnZUlvID0gbmV3IE1lc3NhZ2VJTyhzb2NrZXQsIHRoaXMuY29uZmlnLm9wdGlvbnMucGFja2V0U2l6ZSwgdGhpcy5kZWJ1Zyk7XG4gICAgdGhpcy5tZXNzYWdlSW8ub24oJ3NlY3VyZScsIChjbGVhcnRleHQpID0+IHsgdGhpcy5lbWl0KCdzZWN1cmUnLCBjbGVhcnRleHQpOyB9KTtcblxuICAgIHRoaXMuc29ja2V0ID0gc29ja2V0O1xuXG4gICAgdGhpcy5jbG9zZWQgPSBmYWxzZTtcbiAgICB0aGlzLmRlYnVnLmxvZygnY29ubmVjdGVkIHRvICcgKyB0aGlzLmNvbmZpZy5zZXJ2ZXIgKyAnOicgKyB0aGlzLmNvbmZpZy5vcHRpb25zLnBvcnQpO1xuXG4gICAgdGhpcy5zZW5kUHJlTG9naW4oKTtcbiAgICB0aGlzLnRyYW5zaXRpb25Ubyh0aGlzLlNUQVRFLlNFTlRfUFJFTE9HSU4pO1xuICB9XG5cbiAgd3JhcFdpdGhUbHMoc29ja2V0OiBuZXQuU29ja2V0LCBzaWduYWw6IEFib3J0U2lnbmFsKTogUHJvbWlzZTx0bHMuVExTU29ja2V0PiB7XG4gICAgc2lnbmFsLnRocm93SWZBYm9ydGVkKCk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3Qgc2VjdXJlQ29udGV4dCA9IHRscy5jcmVhdGVTZWN1cmVDb250ZXh0KHRoaXMuc2VjdXJlQ29udGV4dE9wdGlvbnMpO1xuICAgICAgLy8gSWYgY29ubmVjdCB0byBhbiBpcCBhZGRyZXNzIGRpcmVjdGx5LFxuICAgICAgLy8gbmVlZCB0byBzZXQgdGhlIHNlcnZlcm5hbWUgdG8gYW4gZW1wdHkgc3RyaW5nXG4gICAgICAvLyBpZiB0aGUgdXNlciBoYXMgbm90IGdpdmVuIGEgc2VydmVybmFtZSBleHBsaWNpdGx5XG4gICAgICBjb25zdCBzZXJ2ZXJOYW1lID0gIW5ldC5pc0lQKHRoaXMuY29uZmlnLnNlcnZlcikgPyB0aGlzLmNvbmZpZy5zZXJ2ZXIgOiAnJztcbiAgICAgIGNvbnN0IGVuY3J5cHRPcHRpb25zID0ge1xuICAgICAgICBob3N0OiB0aGlzLmNvbmZpZy5zZXJ2ZXIsXG4gICAgICAgIHNvY2tldDogc29ja2V0LFxuICAgICAgICBBTFBOUHJvdG9jb2xzOiBbJ3Rkcy84LjAnXSxcbiAgICAgICAgc2VjdXJlQ29udGV4dDogc2VjdXJlQ29udGV4dCxcbiAgICAgICAgc2VydmVybmFtZTogdGhpcy5jb25maWcub3B0aW9ucy5zZXJ2ZXJOYW1lID8gdGhpcy5jb25maWcub3B0aW9ucy5zZXJ2ZXJOYW1lIDogc2VydmVyTmFtZSxcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGVuY3J5cHRzb2NrZXQgPSB0bHMuY29ubmVjdChlbmNyeXB0T3B0aW9ucyk7XG5cbiAgICAgIGNvbnN0IG9uQWJvcnQgPSAoKSA9PiB7XG4gICAgICAgIGVuY3J5cHRzb2NrZXQucmVtb3ZlTGlzdGVuZXIoJ2Vycm9yJywgb25FcnJvcik7XG4gICAgICAgIGVuY3J5cHRzb2NrZXQucmVtb3ZlTGlzdGVuZXIoJ2Nvbm5lY3QnLCBvbkNvbm5lY3QpO1xuXG4gICAgICAgIGVuY3J5cHRzb2NrZXQuZGVzdHJveSgpO1xuXG4gICAgICAgIHJlamVjdChzaWduYWwucmVhc29uKTtcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IG9uRXJyb3IgPSAoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICBzaWduYWwucmVtb3ZlRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBvbkFib3J0KTtcblxuICAgICAgICBlbmNyeXB0c29ja2V0LnJlbW92ZUxpc3RlbmVyKCdlcnJvcicsIG9uRXJyb3IpO1xuICAgICAgICBlbmNyeXB0c29ja2V0LnJlbW92ZUxpc3RlbmVyKCdjb25uZWN0Jywgb25Db25uZWN0KTtcblxuICAgICAgICBlbmNyeXB0c29ja2V0LmRlc3Ryb3koKTtcblxuICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IG9uQ29ubmVjdCA9ICgpID0+IHtcbiAgICAgICAgc2lnbmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Fib3J0Jywgb25BYm9ydCk7XG5cbiAgICAgICAgZW5jcnlwdHNvY2tldC5yZW1vdmVMaXN0ZW5lcignZXJyb3InLCBvbkVycm9yKTtcbiAgICAgICAgZW5jcnlwdHNvY2tldC5yZW1vdmVMaXN0ZW5lcignY29ubmVjdCcsIG9uQ29ubmVjdCk7XG5cbiAgICAgICAgcmVzb2x2ZShlbmNyeXB0c29ja2V0KTtcbiAgICAgIH07XG5cbiAgICAgIHNpZ25hbC5hZGRFdmVudExpc3RlbmVyKCdhYm9ydCcsIG9uQWJvcnQsIHsgb25jZTogdHJ1ZSB9KTtcblxuICAgICAgZW5jcnlwdHNvY2tldC5vbignZXJyb3InLCBvbkVycm9yKTtcbiAgICAgIGVuY3J5cHRzb2NrZXQub24oJ3NlY3VyZUNvbm5lY3QnLCBvbkNvbm5lY3QpO1xuICAgIH0pO1xuICB9XG5cbiAgY29ubmVjdE9uUG9ydChwb3J0OiBudW1iZXIsIG11bHRpU3VibmV0RmFpbG92ZXI6IGJvb2xlYW4sIHNpZ25hbDogQWJvcnRTaWduYWwsIGN1c3RvbUNvbm5lY3Rvcj86ICgpID0+IFByb21pc2U8bmV0LlNvY2tldD4pIHtcbiAgICBjb25zdCBjb25uZWN0T3B0cyA9IHtcbiAgICAgIGhvc3Q6IHRoaXMucm91dGluZ0RhdGEgPyB0aGlzLnJvdXRpbmdEYXRhLnNlcnZlciA6IHRoaXMuY29uZmlnLnNlcnZlcixcbiAgICAgIHBvcnQ6IHRoaXMucm91dGluZ0RhdGEgPyB0aGlzLnJvdXRpbmdEYXRhLnBvcnQgOiBwb3J0LFxuICAgICAgbG9jYWxBZGRyZXNzOiB0aGlzLmNvbmZpZy5vcHRpb25zLmxvY2FsQWRkcmVzc1xuICAgIH07XG5cbiAgICBjb25zdCBjb25uZWN0ID0gY3VzdG9tQ29ubmVjdG9yIHx8IChtdWx0aVN1Ym5ldEZhaWxvdmVyID8gY29ubmVjdEluUGFyYWxsZWwgOiBjb25uZWN0SW5TZXF1ZW5jZSk7XG5cbiAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgbGV0IHNvY2tldCA9IGF3YWl0IGNvbm5lY3QoY29ubmVjdE9wdHMsIGRucy5sb29rdXAsIHNpZ25hbCk7XG5cbiAgICAgIGlmICh0aGlzLmNvbmZpZy5vcHRpb25zLmVuY3J5cHQgPT09ICdzdHJpY3QnKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gV3JhcCB0aGUgc29ja2V0IHdpdGggVExTIGZvciBURFMgOC4wXG4gICAgICAgICAgc29ja2V0ID0gYXdhaXQgdGhpcy53cmFwV2l0aFRscyhzb2NrZXQsIHNpZ25hbCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIHNvY2tldC5lbmQoKTtcblxuICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLnNvY2tldEhhbmRsaW5nRm9yU2VuZFByZUxvZ2luKHNvY2tldCk7XG4gICAgfSkoKS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICB0aGlzLmNsZWFyQ29ubmVjdFRpbWVyKCk7XG5cbiAgICAgIGlmIChzaWduYWwuYWJvcnRlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHByb2Nlc3MubmV4dFRpY2soKCkgPT4geyB0aGlzLnNvY2tldEVycm9yKGVycik7IH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBjbG9zZUNvbm5lY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuc29ja2V0KSB7XG4gICAgICB0aGlzLnNvY2tldC5kZXN0cm95KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBjcmVhdGVDb25uZWN0VGltZXIoKSB7XG4gICAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICB0aGlzLmNvbm5lY3RUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29udHJvbGxlci5hYm9ydCgpO1xuICAgICAgdGhpcy5jb25uZWN0VGltZW91dCgpO1xuICAgIH0sIHRoaXMuY29uZmlnLm9wdGlvbnMuY29ubmVjdFRpbWVvdXQpO1xuICAgIHJldHVybiBjb250cm9sbGVyLnNpZ25hbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgY3JlYXRlQ2FuY2VsVGltZXIoKSB7XG4gICAgdGhpcy5jbGVhckNhbmNlbFRpbWVyKCk7XG4gICAgY29uc3QgdGltZW91dCA9IHRoaXMuY29uZmlnLm9wdGlvbnMuY2FuY2VsVGltZW91dDtcbiAgICBpZiAodGltZW91dCA+IDApIHtcbiAgICAgIHRoaXMuY2FuY2VsVGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5jYW5jZWxUaW1lb3V0KCk7XG4gICAgICB9LCB0aW1lb3V0KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGNyZWF0ZVJlcXVlc3RUaW1lcigpIHtcbiAgICB0aGlzLmNsZWFyUmVxdWVzdFRpbWVyKCk7IC8vIHJlbGVhc2Ugb2xkIHRpbWVyLCBqdXN0IHRvIGJlIHNhZmVcbiAgICBjb25zdCByZXF1ZXN0ID0gdGhpcy5yZXF1ZXN0IGFzIFJlcXVlc3Q7XG4gICAgY29uc3QgdGltZW91dCA9IChyZXF1ZXN0LnRpbWVvdXQgIT09IHVuZGVmaW5lZCkgPyByZXF1ZXN0LnRpbWVvdXQgOiB0aGlzLmNvbmZpZy5vcHRpb25zLnJlcXVlc3RUaW1lb3V0O1xuICAgIGlmICh0aW1lb3V0KSB7XG4gICAgICB0aGlzLnJlcXVlc3RUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLnJlcXVlc3RUaW1lb3V0KCk7XG4gICAgICB9LCB0aW1lb3V0KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGNyZWF0ZVJldHJ5VGltZXIoKSB7XG4gICAgdGhpcy5jbGVhclJldHJ5VGltZXIoKTtcbiAgICB0aGlzLnJldHJ5VGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMucmV0cnlUaW1lb3V0KCk7XG4gICAgfSwgdGhpcy5jb25maWcub3B0aW9ucy5jb25uZWN0aW9uUmV0cnlJbnRlcnZhbCk7XG4gIH1cblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGNvbm5lY3RUaW1lb3V0KCkge1xuICAgIGNvbnN0IGhvc3RQb3N0Zml4ID0gdGhpcy5jb25maWcub3B0aW9ucy5wb3J0ID8gYDoke3RoaXMuY29uZmlnLm9wdGlvbnMucG9ydH1gIDogYFxcXFwke3RoaXMuY29uZmlnLm9wdGlvbnMuaW5zdGFuY2VOYW1lfWA7XG4gICAgLy8gSWYgd2UgaGF2ZSByb3V0aW5nIGRhdGEgc3RvcmVkLCB0aGlzIGNvbm5lY3Rpb24gaGFzIGJlZW4gcmVkaXJlY3RlZFxuICAgIGNvbnN0IHNlcnZlciA9IHRoaXMucm91dGluZ0RhdGEgPyB0aGlzLnJvdXRpbmdEYXRhLnNlcnZlciA6IHRoaXMuY29uZmlnLnNlcnZlcjtcbiAgICBjb25zdCBwb3J0ID0gdGhpcy5yb3V0aW5nRGF0YSA/IGA6JHt0aGlzLnJvdXRpbmdEYXRhLnBvcnR9YCA6IGhvc3RQb3N0Zml4O1xuICAgIC8vIEdyYWIgdGhlIHRhcmdldCBob3N0IGZyb20gdGhlIGNvbm5lY3Rpb24gY29uZmlndXJhdGlvbiwgYW5kIGZyb20gYSByZWRpcmVjdCBtZXNzYWdlXG4gICAgLy8gb3RoZXJ3aXNlLCBsZWF2ZSB0aGUgbWVzc2FnZSBlbXB0eS5cbiAgICBjb25zdCByb3V0aW5nTWVzc2FnZSA9IHRoaXMucm91dGluZ0RhdGEgPyBgIChyZWRpcmVjdGVkIGZyb20gJHt0aGlzLmNvbmZpZy5zZXJ2ZXJ9JHtob3N0UG9zdGZpeH0pYCA6ICcnO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBgRmFpbGVkIHRvIGNvbm5lY3QgdG8gJHtzZXJ2ZXJ9JHtwb3J0fSR7cm91dGluZ01lc3NhZ2V9IGluICR7dGhpcy5jb25maWcub3B0aW9ucy5jb25uZWN0VGltZW91dH1tc2A7XG4gICAgdGhpcy5kZWJ1Zy5sb2cobWVzc2FnZSk7XG4gICAgdGhpcy5lbWl0KCdjb25uZWN0JywgbmV3IENvbm5lY3Rpb25FcnJvcihtZXNzYWdlLCAnRVRJTUVPVVQnKSk7XG4gICAgdGhpcy5jb25uZWN0VGltZXIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdjb25uZWN0VGltZW91dCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBjYW5jZWxUaW1lb3V0KCkge1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBgRmFpbGVkIHRvIGNhbmNlbCByZXF1ZXN0IGluICR7dGhpcy5jb25maWcub3B0aW9ucy5jYW5jZWxUaW1lb3V0fW1zYDtcbiAgICB0aGlzLmRlYnVnLmxvZyhtZXNzYWdlKTtcbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ3NvY2tldEVycm9yJywgbmV3IENvbm5lY3Rpb25FcnJvcihtZXNzYWdlLCAnRVRJTUVPVVQnKSk7XG4gIH1cblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHJlcXVlc3RUaW1lb3V0KCkge1xuICAgIHRoaXMucmVxdWVzdFRpbWVyID0gdW5kZWZpbmVkO1xuICAgIGNvbnN0IHJlcXVlc3QgPSB0aGlzLnJlcXVlc3QhO1xuICAgIHJlcXVlc3QuY2FuY2VsKCk7XG4gICAgY29uc3QgdGltZW91dCA9IChyZXF1ZXN0LnRpbWVvdXQgIT09IHVuZGVmaW5lZCkgPyByZXF1ZXN0LnRpbWVvdXQgOiB0aGlzLmNvbmZpZy5vcHRpb25zLnJlcXVlc3RUaW1lb3V0O1xuICAgIGNvbnN0IG1lc3NhZ2UgPSAnVGltZW91dDogUmVxdWVzdCBmYWlsZWQgdG8gY29tcGxldGUgaW4gJyArIHRpbWVvdXQgKyAnbXMnO1xuICAgIHJlcXVlc3QuZXJyb3IgPSBuZXcgUmVxdWVzdEVycm9yKG1lc3NhZ2UsICdFVElNRU9VVCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICByZXRyeVRpbWVvdXQoKSB7XG4gICAgdGhpcy5yZXRyeVRpbWVyID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuZW1pdCgncmV0cnknKTtcbiAgICB0aGlzLnRyYW5zaXRpb25Ubyh0aGlzLlNUQVRFLkNPTk5FQ1RJTkcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBjbGVhckNvbm5lY3RUaW1lcigpIHtcbiAgICBpZiAodGhpcy5jb25uZWN0VGltZXIpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLmNvbm5lY3RUaW1lcik7XG4gICAgICB0aGlzLmNvbm5lY3RUaW1lciA9IHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGNsZWFyQ2FuY2VsVGltZXIoKSB7XG4gICAgaWYgKHRoaXMuY2FuY2VsVGltZXIpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLmNhbmNlbFRpbWVyKTtcbiAgICAgIHRoaXMuY2FuY2VsVGltZXIgPSB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBjbGVhclJlcXVlc3RUaW1lcigpIHtcbiAgICBpZiAodGhpcy5yZXF1ZXN0VGltZXIpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLnJlcXVlc3RUaW1lcik7XG4gICAgICB0aGlzLnJlcXVlc3RUaW1lciA9IHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGNsZWFyUmV0cnlUaW1lcigpIHtcbiAgICBpZiAodGhpcy5yZXRyeVRpbWVyKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5yZXRyeVRpbWVyKTtcbiAgICAgIHRoaXMucmV0cnlUaW1lciA9IHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHRyYW5zaXRpb25UbyhuZXdTdGF0ZTogU3RhdGUpIHtcbiAgICBpZiAodGhpcy5zdGF0ZSA9PT0gbmV3U3RhdGUpIHtcbiAgICAgIHRoaXMuZGVidWcubG9nKCdTdGF0ZSBpcyBhbHJlYWR5ICcgKyBuZXdTdGF0ZS5uYW1lKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zdGF0ZSAmJiB0aGlzLnN0YXRlLmV4aXQpIHtcbiAgICAgIHRoaXMuc3RhdGUuZXhpdC5jYWxsKHRoaXMsIG5ld1N0YXRlKTtcbiAgICB9XG5cbiAgICB0aGlzLmRlYnVnLmxvZygnU3RhdGUgY2hhbmdlOiAnICsgKHRoaXMuc3RhdGUgPyB0aGlzLnN0YXRlLm5hbWUgOiAndW5kZWZpbmVkJykgKyAnIC0+ICcgKyBuZXdTdGF0ZS5uYW1lKTtcbiAgICB0aGlzLnN0YXRlID0gbmV3U3RhdGU7XG5cbiAgICBpZiAodGhpcy5zdGF0ZS5lbnRlcikge1xuICAgICAgdGhpcy5zdGF0ZS5lbnRlci5hcHBseSh0aGlzKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGdldEV2ZW50SGFuZGxlcjxUIGV4dGVuZHMga2V5b2YgU3RhdGVbJ2V2ZW50cyddPihldmVudE5hbWU6IFQpOiBOb25OdWxsYWJsZTxTdGF0ZVsnZXZlbnRzJ11bVF0+IHtcbiAgICBjb25zdCBoYW5kbGVyID0gdGhpcy5zdGF0ZS5ldmVudHNbZXZlbnROYW1lXTtcblxuICAgIGlmICghaGFuZGxlcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBldmVudCAnJHtldmVudE5hbWV9JyBpbiBzdGF0ZSAnJHt0aGlzLnN0YXRlLm5hbWV9J2ApO1xuICAgIH1cblxuICAgIHJldHVybiBoYW5kbGVyITtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZGlzcGF0Y2hFdmVudDxUIGV4dGVuZHMga2V5b2YgU3RhdGVbJ2V2ZW50cyddPihldmVudE5hbWU6IFQsIC4uLmFyZ3M6IFBhcmFtZXRlcnM8Tm9uTnVsbGFibGU8U3RhdGVbJ2V2ZW50cyddW1RdPj4pIHtcbiAgICBjb25zdCBoYW5kbGVyID0gdGhpcy5zdGF0ZS5ldmVudHNbZXZlbnROYW1lXSBhcyAoKHRoaXM6IENvbm5lY3Rpb24sIC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkKSB8IHVuZGVmaW5lZDtcbiAgICBpZiAoaGFuZGxlcikge1xuICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lbWl0KCdlcnJvcicsIG5ldyBFcnJvcihgTm8gZXZlbnQgJyR7ZXZlbnROYW1lfScgaW4gc3RhdGUgJyR7dGhpcy5zdGF0ZS5uYW1lfSdgKSk7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBzb2NrZXRFcnJvcihlcnJvcjogRXJyb3IpIHtcbiAgICBpZiAodGhpcy5zdGF0ZSA9PT0gdGhpcy5TVEFURS5DT05ORUNUSU5HIHx8IHRoaXMuc3RhdGUgPT09IHRoaXMuU1RBVEUuU0VOVF9UTFNTU0xORUdPVElBVElPTikge1xuICAgICAgY29uc3QgaG9zdFBvc3RmaXggPSB0aGlzLmNvbmZpZy5vcHRpb25zLnBvcnQgPyBgOiR7dGhpcy5jb25maWcub3B0aW9ucy5wb3J0fWAgOiBgXFxcXCR7dGhpcy5jb25maWcub3B0aW9ucy5pbnN0YW5jZU5hbWV9YDtcbiAgICAgIC8vIElmIHdlIGhhdmUgcm91dGluZyBkYXRhIHN0b3JlZCwgdGhpcyBjb25uZWN0aW9uIGhhcyBiZWVuIHJlZGlyZWN0ZWRcbiAgICAgIGNvbnN0IHNlcnZlciA9IHRoaXMucm91dGluZ0RhdGEgPyB0aGlzLnJvdXRpbmdEYXRhLnNlcnZlciA6IHRoaXMuY29uZmlnLnNlcnZlcjtcbiAgICAgIGNvbnN0IHBvcnQgPSB0aGlzLnJvdXRpbmdEYXRhID8gYDoke3RoaXMucm91dGluZ0RhdGEucG9ydH1gIDogaG9zdFBvc3RmaXg7XG4gICAgICAvLyBHcmFiIHRoZSB0YXJnZXQgaG9zdCBmcm9tIHRoZSBjb25uZWN0aW9uIGNvbmZpZ3VyYXRpb24sIGFuZCBmcm9tIGEgcmVkaXJlY3QgbWVzc2FnZVxuICAgICAgLy8gb3RoZXJ3aXNlLCBsZWF2ZSB0aGUgbWVzc2FnZSBlbXB0eS5cbiAgICAgIGNvbnN0IHJvdXRpbmdNZXNzYWdlID0gdGhpcy5yb3V0aW5nRGF0YSA/IGAgKHJlZGlyZWN0ZWQgZnJvbSAke3RoaXMuY29uZmlnLnNlcnZlcn0ke2hvc3RQb3N0Zml4fSlgIDogJyc7XG4gICAgICBjb25zdCBtZXNzYWdlID0gYEZhaWxlZCB0byBjb25uZWN0IHRvICR7c2VydmVyfSR7cG9ydH0ke3JvdXRpbmdNZXNzYWdlfSAtICR7ZXJyb3IubWVzc2FnZX1gO1xuICAgICAgdGhpcy5kZWJ1Zy5sb2cobWVzc2FnZSk7XG4gICAgICB0aGlzLmVtaXQoJ2Nvbm5lY3QnLCBuZXcgQ29ubmVjdGlvbkVycm9yKG1lc3NhZ2UsICdFU09DS0VUJykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBtZXNzYWdlID0gYENvbm5lY3Rpb24gbG9zdCAtICR7ZXJyb3IubWVzc2FnZX1gO1xuICAgICAgdGhpcy5kZWJ1Zy5sb2cobWVzc2FnZSk7XG4gICAgICB0aGlzLmVtaXQoJ2Vycm9yJywgbmV3IENvbm5lY3Rpb25FcnJvcihtZXNzYWdlLCAnRVNPQ0tFVCcpKTtcbiAgICB9XG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdzb2NrZXRFcnJvcicsIGVycm9yKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgc29ja2V0RW5kKCkge1xuICAgIHRoaXMuZGVidWcubG9nKCdzb2NrZXQgZW5kZWQnKTtcbiAgICBpZiAodGhpcy5zdGF0ZSAhPT0gdGhpcy5TVEFURS5GSU5BTCkge1xuICAgICAgY29uc3QgZXJyb3I6IEVycm9yV2l0aENvZGUgPSBuZXcgRXJyb3IoJ3NvY2tldCBoYW5nIHVwJyk7XG4gICAgICBlcnJvci5jb2RlID0gJ0VDT05OUkVTRVQnO1xuICAgICAgdGhpcy5zb2NrZXRFcnJvcihlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBzb2NrZXRDbG9zZSgpIHtcbiAgICB0aGlzLmRlYnVnLmxvZygnY29ubmVjdGlvbiB0byAnICsgdGhpcy5jb25maWcuc2VydmVyICsgJzonICsgdGhpcy5jb25maWcub3B0aW9ucy5wb3J0ICsgJyBjbG9zZWQnKTtcbiAgICBpZiAodGhpcy5zdGF0ZSA9PT0gdGhpcy5TVEFURS5SRVJPVVRJTkcpIHtcbiAgICAgIHRoaXMuZGVidWcubG9nKCdSZXJvdXRpbmcgdG8gJyArIHRoaXMucm91dGluZ0RhdGEhLnNlcnZlciArICc6JyArIHRoaXMucm91dGluZ0RhdGEhLnBvcnQpO1xuXG4gICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ3JlY29ubmVjdCcpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZSA9PT0gdGhpcy5TVEFURS5UUkFOU0lFTlRfRkFJTFVSRV9SRVRSWSkge1xuICAgICAgY29uc3Qgc2VydmVyID0gdGhpcy5yb3V0aW5nRGF0YSA/IHRoaXMucm91dGluZ0RhdGEuc2VydmVyIDogdGhpcy5jb25maWcuc2VydmVyO1xuICAgICAgY29uc3QgcG9ydCA9IHRoaXMucm91dGluZ0RhdGEgPyB0aGlzLnJvdXRpbmdEYXRhLnBvcnQgOiB0aGlzLmNvbmZpZy5vcHRpb25zLnBvcnQ7XG4gICAgICB0aGlzLmRlYnVnLmxvZygnUmV0cnkgYWZ0ZXIgdHJhbnNpZW50IGZhaWx1cmUgY29ubmVjdGluZyB0byAnICsgc2VydmVyICsgJzonICsgcG9ydCk7XG5cbiAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgncmV0cnknKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy50cmFuc2l0aW9uVG8odGhpcy5TVEFURS5GSU5BTCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBzZW5kUHJlTG9naW4oKSB7XG4gICAgY29uc3QgWywgbWFqb3IsIG1pbm9yLCBidWlsZF0gPSAvXihcXGQrKVxcLihcXGQrKVxcLihcXGQrKS8uZXhlYyh2ZXJzaW9uKSA/PyBbJzAuMC4wJywgJzAnLCAnMCcsICcwJ107XG4gICAgY29uc3QgcGF5bG9hZCA9IG5ldyBQcmVsb2dpblBheWxvYWQoe1xuICAgICAgLy8gSWYgZW5jcnlwdCBzZXR0aW5nIGlzIHNldCB0byAnc3RyaWN0JywgdGhlbiB3ZSBzaG91bGQgaGF2ZSBhbHJlYWR5IGRvbmUgdGhlIGVuY3J5cHRpb24gYmVmb3JlIGNhbGxpbmdcbiAgICAgIC8vIHRoaXMgZnVuY3Rpb24uIFRoZXJlZm9yZSwgdGhlIGVuY3J5cHQgd2lsbCBiZSBzZXQgdG8gZmFsc2UgaGVyZS5cbiAgICAgIC8vIE90aGVyd2lzZSwgd2Ugd2lsbCBzZXQgZW5jcnlwdCBoZXJlIGJhc2VkIG9uIHRoZSBlbmNyeXB0IEJvb2xlYW4gdmFsdWUgZnJvbSB0aGUgY29uZmlndXJhdGlvbi5cbiAgICAgIGVuY3J5cHQ6IHR5cGVvZiB0aGlzLmNvbmZpZy5vcHRpb25zLmVuY3J5cHQgPT09ICdib29sZWFuJyAmJiB0aGlzLmNvbmZpZy5vcHRpb25zLmVuY3J5cHQsXG4gICAgICB2ZXJzaW9uOiB7IG1ham9yOiBOdW1iZXIobWFqb3IpLCBtaW5vcjogTnVtYmVyKG1pbm9yKSwgYnVpbGQ6IE51bWJlcihidWlsZCksIHN1YmJ1aWxkOiAwIH1cbiAgICB9KTtcblxuICAgIHRoaXMubWVzc2FnZUlvLnNlbmRNZXNzYWdlKFRZUEUuUFJFTE9HSU4sIHBheWxvYWQuZGF0YSk7XG4gICAgdGhpcy5kZWJ1Zy5wYXlsb2FkKGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHBheWxvYWQudG9TdHJpbmcoJyAgJyk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHNlbmRMb2dpbjdQYWNrZXQoKSB7XG4gICAgY29uc3QgcGF5bG9hZCA9IG5ldyBMb2dpbjdQYXlsb2FkKHtcbiAgICAgIHRkc1ZlcnNpb246IHZlcnNpb25zW3RoaXMuY29uZmlnLm9wdGlvbnMudGRzVmVyc2lvbl0sXG4gICAgICBwYWNrZXRTaXplOiB0aGlzLmNvbmZpZy5vcHRpb25zLnBhY2tldFNpemUsXG4gICAgICBjbGllbnRQcm9nVmVyOiAwLFxuICAgICAgY2xpZW50UGlkOiBwcm9jZXNzLnBpZCxcbiAgICAgIGNvbm5lY3Rpb25JZDogMCxcbiAgICAgIGNsaWVudFRpbWVab25lOiBuZXcgRGF0ZSgpLmdldFRpbWV6b25lT2Zmc2V0KCksXG4gICAgICBjbGllbnRMY2lkOiAweDAwMDAwNDA5XG4gICAgfSk7XG5cbiAgICBjb25zdCB7IGF1dGhlbnRpY2F0aW9uIH0gPSB0aGlzLmNvbmZpZztcbiAgICBzd2l0Y2ggKGF1dGhlbnRpY2F0aW9uLnR5cGUpIHtcbiAgICAgIGNhc2UgJ2F6dXJlLWFjdGl2ZS1kaXJlY3RvcnktcGFzc3dvcmQnOlxuICAgICAgICBwYXlsb2FkLmZlZEF1dGggPSB7XG4gICAgICAgICAgdHlwZTogJ0FEQUwnLFxuICAgICAgICAgIGVjaG86IHRoaXMuZmVkQXV0aFJlcXVpcmVkLFxuICAgICAgICAgIHdvcmtmbG93OiAnZGVmYXVsdCdcbiAgICAgICAgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2F6dXJlLWFjdGl2ZS1kaXJlY3RvcnktYWNjZXNzLXRva2VuJzpcbiAgICAgICAgcGF5bG9hZC5mZWRBdXRoID0ge1xuICAgICAgICAgIHR5cGU6ICdTRUNVUklUWVRPS0VOJyxcbiAgICAgICAgICBlY2hvOiB0aGlzLmZlZEF1dGhSZXF1aXJlZCxcbiAgICAgICAgICBmZWRBdXRoVG9rZW46IGF1dGhlbnRpY2F0aW9uLm9wdGlvbnMudG9rZW5cbiAgICAgICAgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2F6dXJlLWFjdGl2ZS1kaXJlY3RvcnktbXNpLXZtJzpcbiAgICAgIGNhc2UgJ2F6dXJlLWFjdGl2ZS1kaXJlY3RvcnktZGVmYXVsdCc6XG4gICAgICBjYXNlICdhenVyZS1hY3RpdmUtZGlyZWN0b3J5LW1zaS1hcHAtc2VydmljZSc6XG4gICAgICBjYXNlICdhenVyZS1hY3RpdmUtZGlyZWN0b3J5LXNlcnZpY2UtcHJpbmNpcGFsLXNlY3JldCc6XG4gICAgICAgIHBheWxvYWQuZmVkQXV0aCA9IHtcbiAgICAgICAgICB0eXBlOiAnQURBTCcsXG4gICAgICAgICAgZWNobzogdGhpcy5mZWRBdXRoUmVxdWlyZWQsXG4gICAgICAgICAgd29ya2Zsb3c6ICdpbnRlZ3JhdGVkJ1xuICAgICAgICB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnbnRsbSc6XG4gICAgICAgIHBheWxvYWQuc3NwaSA9IGNyZWF0ZU5UTE1SZXF1ZXN0KHsgZG9tYWluOiBhdXRoZW50aWNhdGlvbi5vcHRpb25zLmRvbWFpbiB9KTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHBheWxvYWQudXNlck5hbWUgPSBhdXRoZW50aWNhdGlvbi5vcHRpb25zLnVzZXJOYW1lO1xuICAgICAgICBwYXlsb2FkLnBhc3N3b3JkID0gYXV0aGVudGljYXRpb24ub3B0aW9ucy5wYXNzd29yZDtcbiAgICB9XG5cbiAgICBwYXlsb2FkLmhvc3RuYW1lID0gdGhpcy5jb25maWcub3B0aW9ucy53b3Jrc3RhdGlvbklkIHx8IG9zLmhvc3RuYW1lKCk7XG4gICAgcGF5bG9hZC5zZXJ2ZXJOYW1lID0gdGhpcy5yb3V0aW5nRGF0YSA/IHRoaXMucm91dGluZ0RhdGEuc2VydmVyIDogdGhpcy5jb25maWcuc2VydmVyO1xuICAgIHBheWxvYWQuYXBwTmFtZSA9IHRoaXMuY29uZmlnLm9wdGlvbnMuYXBwTmFtZSB8fCAnVGVkaW91cyc7XG4gICAgcGF5bG9hZC5saWJyYXJ5TmFtZSA9IGxpYnJhcnlOYW1lO1xuICAgIHBheWxvYWQubGFuZ3VhZ2UgPSB0aGlzLmNvbmZpZy5vcHRpb25zLmxhbmd1YWdlO1xuICAgIHBheWxvYWQuZGF0YWJhc2UgPSB0aGlzLmNvbmZpZy5vcHRpb25zLmRhdGFiYXNlO1xuICAgIHBheWxvYWQuY2xpZW50SWQgPSBCdWZmZXIuZnJvbShbMSwgMiwgMywgNCwgNSwgNl0pO1xuXG4gICAgcGF5bG9hZC5yZWFkT25seUludGVudCA9IHRoaXMuY29uZmlnLm9wdGlvbnMucmVhZE9ubHlJbnRlbnQ7XG4gICAgcGF5bG9hZC5pbml0RGJGYXRhbCA9ICF0aGlzLmNvbmZpZy5vcHRpb25zLmZhbGxiYWNrVG9EZWZhdWx0RGI7XG5cbiAgICB0aGlzLnJvdXRpbmdEYXRhID0gdW5kZWZpbmVkO1xuICAgIHRoaXMubWVzc2FnZUlvLnNlbmRNZXNzYWdlKFRZUEUuTE9HSU43LCBwYXlsb2FkLnRvQnVmZmVyKCkpO1xuXG4gICAgdGhpcy5kZWJ1Zy5wYXlsb2FkKGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHBheWxvYWQudG9TdHJpbmcoJyAgJyk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHNlbmRGZWRBdXRoVG9rZW5NZXNzYWdlKHRva2VuOiBzdHJpbmcpIHtcbiAgICBjb25zdCBhY2Nlc3NUb2tlbkxlbiA9IEJ1ZmZlci5ieXRlTGVuZ3RoKHRva2VuLCAndWNzMicpO1xuICAgIGNvbnN0IGRhdGEgPSBCdWZmZXIuYWxsb2MoOCArIGFjY2Vzc1Rva2VuTGVuKTtcbiAgICBsZXQgb2Zmc2V0ID0gMDtcbiAgICBvZmZzZXQgPSBkYXRhLndyaXRlVUludDMyTEUoYWNjZXNzVG9rZW5MZW4gKyA0LCBvZmZzZXQpO1xuICAgIG9mZnNldCA9IGRhdGEud3JpdGVVSW50MzJMRShhY2Nlc3NUb2tlbkxlbiwgb2Zmc2V0KTtcbiAgICBkYXRhLndyaXRlKHRva2VuLCBvZmZzZXQsICd1Y3MyJyk7XG4gICAgdGhpcy5tZXNzYWdlSW8uc2VuZE1lc3NhZ2UoVFlQRS5GRURBVVRIX1RPS0VOLCBkYXRhKTtcbiAgICAvLyBzZW50IHRoZSBmZWRBdXRoIHRva2VuIG1lc3NhZ2UsIHRoZSByZXN0IGlzIHNpbWlsYXIgdG8gc3RhbmRhcmQgbG9naW4gN1xuICAgIHRoaXMudHJhbnNpdGlvblRvKHRoaXMuU1RBVEUuU0VOVF9MT0dJTjdfV0lUSF9TVEFOREFSRF9MT0dJTik7XG4gIH1cblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHNlbmRJbml0aWFsU3FsKCkge1xuICAgIGNvbnN0IHBheWxvYWQgPSBuZXcgU3FsQmF0Y2hQYXlsb2FkKHRoaXMuZ2V0SW5pdGlhbFNxbCgpLCB0aGlzLmN1cnJlbnRUcmFuc2FjdGlvbkRlc2NyaXB0b3IoKSwgdGhpcy5jb25maWcub3B0aW9ucyk7XG5cbiAgICBjb25zdCBtZXNzYWdlID0gbmV3IE1lc3NhZ2UoeyB0eXBlOiBUWVBFLlNRTF9CQVRDSCB9KTtcbiAgICB0aGlzLm1lc3NhZ2VJby5vdXRnb2luZ01lc3NhZ2VTdHJlYW0ud3JpdGUobWVzc2FnZSk7XG4gICAgUmVhZGFibGUuZnJvbShwYXlsb2FkKS5waXBlKG1lc3NhZ2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBnZXRJbml0aWFsU3FsKCkge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBbXTtcblxuICAgIGlmICh0aGlzLmNvbmZpZy5vcHRpb25zLmVuYWJsZUFuc2lOdWxsID09PSB0cnVlKSB7XG4gICAgICBvcHRpb25zLnB1c2goJ3NldCBhbnNpX251bGxzIG9uJyk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmNvbmZpZy5vcHRpb25zLmVuYWJsZUFuc2lOdWxsID09PSBmYWxzZSkge1xuICAgICAgb3B0aW9ucy5wdXNoKCdzZXQgYW5zaV9udWxscyBvZmYnKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5jb25maWcub3B0aW9ucy5lbmFibGVBbnNpTnVsbERlZmF1bHQgPT09IHRydWUpIHtcbiAgICAgIG9wdGlvbnMucHVzaCgnc2V0IGFuc2lfbnVsbF9kZmx0X29uIG9uJyk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmNvbmZpZy5vcHRpb25zLmVuYWJsZUFuc2lOdWxsRGVmYXVsdCA9PT0gZmFsc2UpIHtcbiAgICAgIG9wdGlvbnMucHVzaCgnc2V0IGFuc2lfbnVsbF9kZmx0X29uIG9mZicpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmNvbmZpZy5vcHRpb25zLmVuYWJsZUFuc2lQYWRkaW5nID09PSB0cnVlKSB7XG4gICAgICBvcHRpb25zLnB1c2goJ3NldCBhbnNpX3BhZGRpbmcgb24nKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuY29uZmlnLm9wdGlvbnMuZW5hYmxlQW5zaVBhZGRpbmcgPT09IGZhbHNlKSB7XG4gICAgICBvcHRpb25zLnB1c2goJ3NldCBhbnNpX3BhZGRpbmcgb2ZmJyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY29uZmlnLm9wdGlvbnMuZW5hYmxlQW5zaVdhcm5pbmdzID09PSB0cnVlKSB7XG4gICAgICBvcHRpb25zLnB1c2goJ3NldCBhbnNpX3dhcm5pbmdzIG9uJyk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmNvbmZpZy5vcHRpb25zLmVuYWJsZUFuc2lXYXJuaW5ncyA9PT0gZmFsc2UpIHtcbiAgICAgIG9wdGlvbnMucHVzaCgnc2V0IGFuc2lfd2FybmluZ3Mgb2ZmJyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY29uZmlnLm9wdGlvbnMuZW5hYmxlQXJpdGhBYm9ydCA9PT0gdHJ1ZSkge1xuICAgICAgb3B0aW9ucy5wdXNoKCdzZXQgYXJpdGhhYm9ydCBvbicpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5jb25maWcub3B0aW9ucy5lbmFibGVBcml0aEFib3J0ID09PSBmYWxzZSkge1xuICAgICAgb3B0aW9ucy5wdXNoKCdzZXQgYXJpdGhhYm9ydCBvZmYnKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5jb25maWcub3B0aW9ucy5lbmFibGVDb25jYXROdWxsWWllbGRzTnVsbCA9PT0gdHJ1ZSkge1xuICAgICAgb3B0aW9ucy5wdXNoKCdzZXQgY29uY2F0X251bGxfeWllbGRzX251bGwgb24nKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuY29uZmlnLm9wdGlvbnMuZW5hYmxlQ29uY2F0TnVsbFlpZWxkc051bGwgPT09IGZhbHNlKSB7XG4gICAgICBvcHRpb25zLnB1c2goJ3NldCBjb25jYXRfbnVsbF95aWVsZHNfbnVsbCBvZmYnKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5jb25maWcub3B0aW9ucy5lbmFibGVDdXJzb3JDbG9zZU9uQ29tbWl0ID09PSB0cnVlKSB7XG4gICAgICBvcHRpb25zLnB1c2goJ3NldCBjdXJzb3JfY2xvc2Vfb25fY29tbWl0IG9uJyk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmNvbmZpZy5vcHRpb25zLmVuYWJsZUN1cnNvckNsb3NlT25Db21taXQgPT09IGZhbHNlKSB7XG4gICAgICBvcHRpb25zLnB1c2goJ3NldCBjdXJzb3JfY2xvc2Vfb25fY29tbWl0IG9mZicpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmNvbmZpZy5vcHRpb25zLmRhdGVmaXJzdCAhPT0gbnVsbCkge1xuICAgICAgb3B0aW9ucy5wdXNoKGBzZXQgZGF0ZWZpcnN0ICR7dGhpcy5jb25maWcub3B0aW9ucy5kYXRlZmlyc3R9YCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY29uZmlnLm9wdGlvbnMuZGF0ZUZvcm1hdCAhPT0gbnVsbCkge1xuICAgICAgb3B0aW9ucy5wdXNoKGBzZXQgZGF0ZWZvcm1hdCAke3RoaXMuY29uZmlnLm9wdGlvbnMuZGF0ZUZvcm1hdH1gKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5jb25maWcub3B0aW9ucy5lbmFibGVJbXBsaWNpdFRyYW5zYWN0aW9ucyA9PT0gdHJ1ZSkge1xuICAgICAgb3B0aW9ucy5wdXNoKCdzZXQgaW1wbGljaXRfdHJhbnNhY3Rpb25zIG9uJyk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmNvbmZpZy5vcHRpb25zLmVuYWJsZUltcGxpY2l0VHJhbnNhY3Rpb25zID09PSBmYWxzZSkge1xuICAgICAgb3B0aW9ucy5wdXNoKCdzZXQgaW1wbGljaXRfdHJhbnNhY3Rpb25zIG9mZicpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmNvbmZpZy5vcHRpb25zLmxhbmd1YWdlICE9PSBudWxsKSB7XG4gICAgICBvcHRpb25zLnB1c2goYHNldCBsYW5ndWFnZSAke3RoaXMuY29uZmlnLm9wdGlvbnMubGFuZ3VhZ2V9YCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY29uZmlnLm9wdGlvbnMuZW5hYmxlTnVtZXJpY1JvdW5kYWJvcnQgPT09IHRydWUpIHtcbiAgICAgIG9wdGlvbnMucHVzaCgnc2V0IG51bWVyaWNfcm91bmRhYm9ydCBvbicpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5jb25maWcub3B0aW9ucy5lbmFibGVOdW1lcmljUm91bmRhYm9ydCA9PT0gZmFsc2UpIHtcbiAgICAgIG9wdGlvbnMucHVzaCgnc2V0IG51bWVyaWNfcm91bmRhYm9ydCBvZmYnKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5jb25maWcub3B0aW9ucy5lbmFibGVRdW90ZWRJZGVudGlmaWVyID09PSB0cnVlKSB7XG4gICAgICBvcHRpb25zLnB1c2goJ3NldCBxdW90ZWRfaWRlbnRpZmllciBvbicpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5jb25maWcub3B0aW9ucy5lbmFibGVRdW90ZWRJZGVudGlmaWVyID09PSBmYWxzZSkge1xuICAgICAgb3B0aW9ucy5wdXNoKCdzZXQgcXVvdGVkX2lkZW50aWZpZXIgb2ZmJyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY29uZmlnLm9wdGlvbnMudGV4dHNpemUgIT09IG51bGwpIHtcbiAgICAgIG9wdGlvbnMucHVzaChgc2V0IHRleHRzaXplICR7dGhpcy5jb25maWcub3B0aW9ucy50ZXh0c2l6ZX1gKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5jb25maWcub3B0aW9ucy5jb25uZWN0aW9uSXNvbGF0aW9uTGV2ZWwgIT09IG51bGwpIHtcbiAgICAgIG9wdGlvbnMucHVzaChgc2V0IHRyYW5zYWN0aW9uIGlzb2xhdGlvbiBsZXZlbCAke3RoaXMuZ2V0SXNvbGF0aW9uTGV2ZWxUZXh0KHRoaXMuY29uZmlnLm9wdGlvbnMuY29ubmVjdGlvbklzb2xhdGlvbkxldmVsKX1gKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5jb25maWcub3B0aW9ucy5hYm9ydFRyYW5zYWN0aW9uT25FcnJvciA9PT0gdHJ1ZSkge1xuICAgICAgb3B0aW9ucy5wdXNoKCdzZXQgeGFjdF9hYm9ydCBvbicpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5jb25maWcub3B0aW9ucy5hYm9ydFRyYW5zYWN0aW9uT25FcnJvciA9PT0gZmFsc2UpIHtcbiAgICAgIG9wdGlvbnMucHVzaCgnc2V0IHhhY3RfYWJvcnQgb2ZmJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9wdGlvbnMuam9pbignXFxuJyk7XG4gIH1cblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByb2Nlc3NlZEluaXRpYWxTcWwoKSB7XG4gICAgdGhpcy5jbGVhckNvbm5lY3RUaW1lcigpO1xuICAgIHRoaXMuZW1pdCgnY29ubmVjdCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGUgdGhlIFNRTCBiYXRjaCByZXByZXNlbnRlZCBieSBbW1JlcXVlc3RdXS5cbiAgICogVGhlcmUgaXMgbm8gcGFyYW0gc3VwcG9ydCwgYW5kIHVubGlrZSBbW1JlcXVlc3QuZXhlY1NxbF1dLFxuICAgKiBpdCBpcyBub3QgbGlrZWx5IHRoYXQgU1FMIFNlcnZlciB3aWxsIHJldXNlIHRoZSBleGVjdXRpb24gcGxhbiBpdCBnZW5lcmF0ZXMgZm9yIHRoZSBTUUwuXG4gICAqXG4gICAqIEluIGFsbW9zdCBhbGwgY2FzZXMsIFtbUmVxdWVzdC5leGVjU3FsXV0gd2lsbCBiZSBhIGJldHRlciBjaG9pY2UuXG4gICAqXG4gICAqIEBwYXJhbSByZXF1ZXN0IEEgW1tSZXF1ZXN0XV0gb2JqZWN0IHJlcHJlc2VudGluZyB0aGUgcmVxdWVzdC5cbiAgICovXG4gIGV4ZWNTcWxCYXRjaChyZXF1ZXN0OiBSZXF1ZXN0KSB7XG4gICAgdGhpcy5tYWtlUmVxdWVzdChyZXF1ZXN0LCBUWVBFLlNRTF9CQVRDSCwgbmV3IFNxbEJhdGNoUGF5bG9hZChyZXF1ZXN0LnNxbFRleHRPclByb2NlZHVyZSEsIHRoaXMuY3VycmVudFRyYW5zYWN0aW9uRGVzY3JpcHRvcigpLCB0aGlzLmNvbmZpZy5vcHRpb25zKSk7XG4gIH1cblxuICAvKipcbiAgICogIEV4ZWN1dGUgdGhlIFNRTCByZXByZXNlbnRlZCBieSBbW1JlcXVlc3RdXS5cbiAgICpcbiAgICogQXMgYHNwX2V4ZWN1dGVzcWxgIGlzIHVzZWQgdG8gZXhlY3V0ZSB0aGUgU1FMLCBpZiB0aGUgc2FtZSBTUUwgaXMgZXhlY3V0ZWQgbXVsdGlwbGVzIHRpbWVzXG4gICAqIHVzaW5nIHRoaXMgZnVuY3Rpb24sIHRoZSBTUUwgU2VydmVyIHF1ZXJ5IG9wdGltaXplciBpcyBsaWtlbHkgdG8gcmV1c2UgdGhlIGV4ZWN1dGlvbiBwbGFuIGl0IGdlbmVyYXRlc1xuICAgKiBmb3IgdGhlIGZpcnN0IGV4ZWN1dGlvbi4gVGhpcyBtYXkgYWxzbyByZXN1bHQgaW4gU1FMIHNlcnZlciB0cmVhdGluZyB0aGUgcmVxdWVzdCBsaWtlIGEgc3RvcmVkIHByb2NlZHVyZVxuICAgKiB3aGljaCBjYW4gcmVzdWx0IGluIHRoZSBbW0V2ZW50X2RvbmVJblByb2NdXSBvciBbW0V2ZW50X2RvbmVQcm9jXV0gZXZlbnRzIGJlaW5nIGVtaXR0ZWQgaW5zdGVhZCBvZiB0aGVcbiAgICogW1tFdmVudF9kb25lXV0gZXZlbnQgeW91IG1pZ2h0IGV4cGVjdC4gVXNpbmcgW1tleGVjU3FsQmF0Y2hdXSB3aWxsIHByZXZlbnQgdGhpcyBmcm9tIG9jY3VycmluZyBidXQgbWF5IGhhdmUgYSBuZWdhdGl2ZSBwZXJmb3JtYW5jZSBpbXBhY3QuXG4gICAqXG4gICAqIEJld2FyZSBvZiB0aGUgd2F5IHRoYXQgc2NvcGluZyBydWxlcyBhcHBseSwgYW5kIGhvdyB0aGV5IG1heSBbYWZmZWN0IGxvY2FsIHRlbXAgdGFibGVzXShodHRwOi8vd2VibG9ncy5zcWx0ZWFtLmNvbS9tbGFkZW5wL2FyY2hpdmUvMjAwNi8xMS8wMy8xNzE5Ny5hc3B4KVxuICAgKiBJZiB5b3UncmUgcnVubmluZyBpbiB0byBzY29waW5nIGlzc3VlcywgdGhlbiBbW2V4ZWNTcWxCYXRjaF1dIG1heSBiZSBhIGJldHRlciBjaG9pY2UuXG4gICAqIFNlZSBhbHNvIFtpc3N1ZSAjMjRdKGh0dHBzOi8vZ2l0aHViLmNvbS9wZWtpbS90ZWRpb3VzL2lzc3Vlcy8yNClcbiAgICpcbiAgICogQHBhcmFtIHJlcXVlc3QgQSBbW1JlcXVlc3RdXSBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSByZXF1ZXN0LlxuICAgKi9cbiAgZXhlY1NxbChyZXF1ZXN0OiBSZXF1ZXN0KSB7XG4gICAgdHJ5IHtcbiAgICAgIHJlcXVlc3QudmFsaWRhdGVQYXJhbWV0ZXJzKHRoaXMuZGF0YWJhc2VDb2xsYXRpb24pO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIHJlcXVlc3QuZXJyb3IgPSBlcnJvcjtcblxuICAgICAgcHJvY2Vzcy5uZXh0VGljaygoKSA9PiB7XG4gICAgICAgIHRoaXMuZGVidWcubG9nKGVycm9yLm1lc3NhZ2UpO1xuICAgICAgICByZXF1ZXN0LmNhbGxiYWNrKGVycm9yKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcGFyYW1ldGVyczogUGFyYW1ldGVyW10gPSBbXTtcblxuICAgIHBhcmFtZXRlcnMucHVzaCh7XG4gICAgICB0eXBlOiBUWVBFUy5OVmFyQ2hhcixcbiAgICAgIG5hbWU6ICdzdGF0ZW1lbnQnLFxuICAgICAgdmFsdWU6IHJlcXVlc3Quc3FsVGV4dE9yUHJvY2VkdXJlLFxuICAgICAgb3V0cHV0OiBmYWxzZSxcbiAgICAgIGxlbmd0aDogdW5kZWZpbmVkLFxuICAgICAgcHJlY2lzaW9uOiB1bmRlZmluZWQsXG4gICAgICBzY2FsZTogdW5kZWZpbmVkXG4gICAgfSk7XG5cbiAgICBpZiAocmVxdWVzdC5wYXJhbWV0ZXJzLmxlbmd0aCkge1xuICAgICAgcGFyYW1ldGVycy5wdXNoKHtcbiAgICAgICAgdHlwZTogVFlQRVMuTlZhckNoYXIsXG4gICAgICAgIG5hbWU6ICdwYXJhbXMnLFxuICAgICAgICB2YWx1ZTogcmVxdWVzdC5tYWtlUGFyYW1zUGFyYW1ldGVyKHJlcXVlc3QucGFyYW1ldGVycyksXG4gICAgICAgIG91dHB1dDogZmFsc2UsXG4gICAgICAgIGxlbmd0aDogdW5kZWZpbmVkLFxuICAgICAgICBwcmVjaXNpb246IHVuZGVmaW5lZCxcbiAgICAgICAgc2NhbGU6IHVuZGVmaW5lZFxuICAgICAgfSk7XG5cbiAgICAgIHBhcmFtZXRlcnMucHVzaCguLi5yZXF1ZXN0LnBhcmFtZXRlcnMpO1xuICAgIH1cblxuICAgIHRoaXMubWFrZVJlcXVlc3QocmVxdWVzdCwgVFlQRS5SUENfUkVRVUVTVCwgbmV3IFJwY1JlcXVlc3RQYXlsb2FkKFByb2NlZHVyZXMuU3BfRXhlY3V0ZVNxbCwgcGFyYW1ldGVycywgdGhpcy5jdXJyZW50VHJhbnNhY3Rpb25EZXNjcmlwdG9yKCksIHRoaXMuY29uZmlnLm9wdGlvbnMsIHRoaXMuZGF0YWJhc2VDb2xsYXRpb24pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IEJ1bGtMb2FkIGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0gdGFibGUgVGhlIG5hbWUgb2YgdGhlIHRhYmxlIHRvIGJ1bGstaW5zZXJ0IGludG8uXG4gICAqIEBwYXJhbSBvcHRpb25zIEEgc2V0IG9mIGJ1bGsgbG9hZCBvcHRpb25zLlxuICAgKi9cbiAgbmV3QnVsa0xvYWQodGFibGU6IHN0cmluZywgY2FsbGJhY2s6IEJ1bGtMb2FkQ2FsbGJhY2spOiBCdWxrTG9hZFxuICBuZXdCdWxrTG9hZCh0YWJsZTogc3RyaW5nLCBvcHRpb25zOiBCdWxrTG9hZE9wdGlvbnMsIGNhbGxiYWNrOiBCdWxrTG9hZENhbGxiYWNrKTogQnVsa0xvYWRcbiAgbmV3QnVsa0xvYWQodGFibGU6IHN0cmluZywgY2FsbGJhY2tPck9wdGlvbnM6IEJ1bGtMb2FkT3B0aW9ucyB8IEJ1bGtMb2FkQ2FsbGJhY2ssIGNhbGxiYWNrPzogQnVsa0xvYWRDYWxsYmFjaykge1xuICAgIGxldCBvcHRpb25zOiBCdWxrTG9hZE9wdGlvbnM7XG5cbiAgICBpZiAoY2FsbGJhY2sgPT09IHVuZGVmaW5lZCkge1xuICAgICAgY2FsbGJhY2sgPSBjYWxsYmFja09yT3B0aW9ucyBhcyBCdWxrTG9hZENhbGxiYWNrO1xuICAgICAgb3B0aW9ucyA9IHt9O1xuICAgIH0gZWxzZSB7XG4gICAgICBvcHRpb25zID0gY2FsbGJhY2tPck9wdGlvbnMgYXMgQnVsa0xvYWRPcHRpb25zO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyAhPT0gJ29iamVjdCcpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wib3B0aW9uc1wiIGFyZ3VtZW50IG11c3QgYmUgYW4gb2JqZWN0Jyk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgQnVsa0xvYWQodGFibGUsIHRoaXMuZGF0YWJhc2VDb2xsYXRpb24sIHRoaXMuY29uZmlnLm9wdGlvbnMsIG9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlIGEgW1tCdWxrTG9hZF1dLlxuICAgKlxuICAgKiBgYGBqc1xuICAgKiAvLyBXZSB3YW50IHRvIHBlcmZvcm0gYSBidWxrIGxvYWQgaW50byBhIHRhYmxlIHdpdGggdGhlIGZvbGxvd2luZyBmb3JtYXQ6XG4gICAqIC8vIENSRUFURSBUQUJMRSBlbXBsb3llZXMgKGZpcnN0X25hbWUgbnZhcmNoYXIoMjU1KSwgbGFzdF9uYW1lIG52YXJjaGFyKDI1NSksIGRheV9vZl9iaXJ0aCBkYXRlKTtcbiAgICpcbiAgICogY29uc3QgYnVsa0xvYWQgPSBjb25uZWN0aW9uLm5ld0J1bGtMb2FkKCdlbXBsb3llZXMnLCAoZXJyLCByb3dDb3VudCkgPT4ge1xuICAgKiAgIC8vIC4uLlxuICAgKiB9KTtcbiAgICpcbiAgICogLy8gRmlyc3QsIHdlIG5lZWQgdG8gc3BlY2lmeSB0aGUgY29sdW1ucyB0aGF0IHdlIHdhbnQgdG8gd3JpdGUgdG8sXG4gICAqIC8vIGFuZCB0aGVpciBkZWZpbml0aW9ucy4gVGhlc2UgZGVmaW5pdGlvbnMgbXVzdCBtYXRjaCB0aGUgYWN0dWFsIHRhYmxlLFxuICAgKiAvLyBvdGhlcndpc2UgdGhlIGJ1bGsgbG9hZCB3aWxsIGZhaWwuXG4gICAqIGJ1bGtMb2FkLmFkZENvbHVtbignZmlyc3RfbmFtZScsIFRZUEVTLk5WYXJjaGFyLCB7IG51bGxhYmxlOiBmYWxzZSB9KTtcbiAgICogYnVsa0xvYWQuYWRkQ29sdW1uKCdsYXN0X25hbWUnLCBUWVBFUy5OVmFyY2hhciwgeyBudWxsYWJsZTogZmFsc2UgfSk7XG4gICAqIGJ1bGtMb2FkLmFkZENvbHVtbignZGF0ZV9vZl9iaXJ0aCcsIFRZUEVTLkRhdGUsIHsgbnVsbGFibGU6IGZhbHNlIH0pO1xuICAgKlxuICAgKiAvLyBFeGVjdXRlIGEgYnVsayBsb2FkIHdpdGggYSBwcmVkZWZpbmVkIGxpc3Qgb2Ygcm93cy5cbiAgICogLy9cbiAgICogLy8gTm90ZSB0aGF0IHRoZXNlIHJvd3MgYXJlIGhlbGQgaW4gbWVtb3J5IHVudGlsIHRoZVxuICAgKiAvLyBidWxrIGxvYWQgd2FzIHBlcmZvcm1lZCwgc28gaWYgeW91IG5lZWQgdG8gd3JpdGUgYSBsYXJnZVxuICAgKiAvLyBudW1iZXIgb2Ygcm93cyAoZS5nLiBieSByZWFkaW5nIGZyb20gYSBDU1YgZmlsZSksXG4gICAqIC8vIHBhc3NpbmcgYW4gYEFzeW5jSXRlcmFibGVgIGlzIGFkdmlzYWJsZSB0byBrZWVwIG1lbW9yeSB1c2FnZSBsb3cuXG4gICAqIGNvbm5lY3Rpb24uZXhlY0J1bGtMb2FkKGJ1bGtMb2FkLCBbXG4gICAqICAgeyAnZmlyc3RfbmFtZSc6ICdTdGV2ZScsICdsYXN0X25hbWUnOiAnSm9icycsICdkYXlfb2ZfYmlydGgnOiBuZXcgRGF0ZSgnMDItMjQtMTk1NScpIH0sXG4gICAqICAgeyAnZmlyc3RfbmFtZSc6ICdCaWxsJywgJ2xhc3RfbmFtZSc6ICdHYXRlcycsICdkYXlfb2ZfYmlydGgnOiBuZXcgRGF0ZSgnMTAtMjgtMTk1NScpIH1cbiAgICogXSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gYnVsa0xvYWQgQSBwcmV2aW91c2x5IGNyZWF0ZWQgW1tCdWxrTG9hZF1dLlxuICAgKiBAcGFyYW0gcm93cyBBIFtbSXRlcmFibGVdXSBvciBbW0FzeW5jSXRlcmFibGVdXSB0aGF0IGNvbnRhaW5zIHRoZSByb3dzIHRoYXQgc2hvdWxkIGJlIGJ1bGsgbG9hZGVkLlxuICAgKi9cbiAgZXhlY0J1bGtMb2FkKGJ1bGtMb2FkOiBCdWxrTG9hZCwgcm93czogQXN5bmNJdGVyYWJsZTx1bmtub3duW10gfCB7IFtjb2x1bW5OYW1lOiBzdHJpbmddOiB1bmtub3duIH0+IHwgSXRlcmFibGU8dW5rbm93bltdIHwgeyBbY29sdW1uTmFtZTogc3RyaW5nXTogdW5rbm93biB9Pik6IHZvaWRcblxuICBleGVjQnVsa0xvYWQoYnVsa0xvYWQ6IEJ1bGtMb2FkLCByb3dzPzogQXN5bmNJdGVyYWJsZTx1bmtub3duW10gfCB7IFtjb2x1bW5OYW1lOiBzdHJpbmddOiB1bmtub3duIH0+IHwgSXRlcmFibGU8dW5rbm93bltdIHwgeyBbY29sdW1uTmFtZTogc3RyaW5nXTogdW5rbm93biB9Pikge1xuICAgIGJ1bGtMb2FkLmV4ZWN1dGlvblN0YXJ0ZWQgPSB0cnVlO1xuXG4gICAgaWYgKHJvd3MpIHtcbiAgICAgIGlmIChidWxrTG9hZC5zdHJlYW1pbmdNb2RlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvbm5lY3Rpb24uZXhlY0J1bGtMb2FkIGNhbid0IGJlIGNhbGxlZCB3aXRoIGEgQnVsa0xvYWQgdGhhdCB3YXMgcHV0IGluIHN0cmVhbWluZyBtb2RlLlwiKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGJ1bGtMb2FkLmZpcnN0Um93V3JpdHRlbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb25uZWN0aW9uLmV4ZWNCdWxrTG9hZCBjYW4ndCBiZSBjYWxsZWQgd2l0aCBhIEJ1bGtMb2FkIHRoYXQgYWxyZWFkeSBoYXMgcm93cyB3cml0dGVuIHRvIGl0LlwiKTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgcm93U3RyZWFtID0gUmVhZGFibGUuZnJvbShyb3dzKTtcblxuICAgICAgLy8gRGVzdHJveSB0aGUgcGFja2V0IHRyYW5zZm9ybSBpZiBhbiBlcnJvciBoYXBwZW5zIGluIHRoZSByb3cgc3RyZWFtLFxuICAgICAgLy8gZS5nLiBpZiBhbiBlcnJvciBpcyB0aHJvd24gZnJvbSB3aXRoaW4gYSBnZW5lcmF0b3Igb3Igc3RyZWFtLlxuICAgICAgcm93U3RyZWFtLm9uKCdlcnJvcicsIChlcnIpID0+IHtcbiAgICAgICAgYnVsa0xvYWQucm93VG9QYWNrZXRUcmFuc2Zvcm0uZGVzdHJveShlcnIpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIERlc3Ryb3kgdGhlIHJvdyBzdHJlYW0gaWYgYW4gZXJyb3IgaGFwcGVucyBpbiB0aGUgcGFja2V0IHRyYW5zZm9ybSxcbiAgICAgIC8vIGUuZy4gaWYgdGhlIGJ1bGsgbG9hZCBpcyBjYW5jZWxsZWQuXG4gICAgICBidWxrTG9hZC5yb3dUb1BhY2tldFRyYW5zZm9ybS5vbignZXJyb3InLCAoZXJyKSA9PiB7XG4gICAgICAgIHJvd1N0cmVhbS5kZXN0cm95KGVycik7XG4gICAgICB9KTtcblxuICAgICAgcm93U3RyZWFtLnBpcGUoYnVsa0xvYWQucm93VG9QYWNrZXRUcmFuc2Zvcm0pO1xuICAgIH0gZWxzZSBpZiAoIWJ1bGtMb2FkLnN0cmVhbWluZ01vZGUpIHtcbiAgICAgIC8vIElmIHRoZSBidWxrbG9hZCB3YXMgbm90IHB1dCBpbnRvIHN0cmVhbWluZyBtb2RlIGJ5IHRoZSB1c2VyLFxuICAgICAgLy8gd2UgZW5kIHRoZSByb3dUb1BhY2tldFRyYW5zZm9ybSBoZXJlIGZvciB0aGVtLlxuICAgICAgLy9cbiAgICAgIC8vIElmIGl0IHdhcyBwdXQgaW50byBzdHJlYW1pbmcgbW9kZSwgaXQncyB0aGUgdXNlcidzIHJlc3BvbnNpYmlsaXR5XG4gICAgICAvLyB0byBlbmQgdGhlIHN0cmVhbS5cbiAgICAgIGJ1bGtMb2FkLnJvd1RvUGFja2V0VHJhbnNmb3JtLmVuZCgpO1xuICAgIH1cblxuICAgIGNvbnN0IG9uQ2FuY2VsID0gKCkgPT4ge1xuICAgICAgcmVxdWVzdC5jYW5jZWwoKTtcbiAgICB9O1xuXG4gICAgY29uc3QgcGF5bG9hZCA9IG5ldyBCdWxrTG9hZFBheWxvYWQoYnVsa0xvYWQpO1xuXG4gICAgY29uc3QgcmVxdWVzdCA9IG5ldyBSZXF1ZXN0KGJ1bGtMb2FkLmdldEJ1bGtJbnNlcnRTcWwoKSwgKGVycm9yOiAoRXJyb3IgJiB7IGNvZGU/OiBzdHJpbmcgfSkgfCBudWxsIHwgdW5kZWZpbmVkKSA9PiB7XG4gICAgICBidWxrTG9hZC5yZW1vdmVMaXN0ZW5lcignY2FuY2VsJywgb25DYW5jZWwpO1xuXG4gICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgaWYgKGVycm9yLmNvZGUgPT09ICdVTktOT1dOJykge1xuICAgICAgICAgIGVycm9yLm1lc3NhZ2UgKz0gJyBUaGlzIGlzIGxpa2VseSBiZWNhdXNlIHRoZSBzY2hlbWEgb2YgdGhlIEJ1bGtMb2FkIGRvZXMgbm90IG1hdGNoIHRoZSBzY2hlbWEgb2YgdGhlIHRhYmxlIHlvdSBhcmUgYXR0ZW1wdGluZyB0byBpbnNlcnQgaW50by4nO1xuICAgICAgICB9XG4gICAgICAgIGJ1bGtMb2FkLmVycm9yID0gZXJyb3I7XG4gICAgICAgIGJ1bGtMb2FkLmNhbGxiYWNrKGVycm9yKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB0aGlzLm1ha2VSZXF1ZXN0KGJ1bGtMb2FkLCBUWVBFLkJVTEtfTE9BRCwgcGF5bG9hZCk7XG4gICAgfSk7XG5cbiAgICBidWxrTG9hZC5vbmNlKCdjYW5jZWwnLCBvbkNhbmNlbCk7XG5cbiAgICB0aGlzLmV4ZWNTcWxCYXRjaChyZXF1ZXN0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmVwYXJlIHRoZSBTUUwgcmVwcmVzZW50ZWQgYnkgdGhlIHJlcXVlc3QuXG4gICAqXG4gICAqIFRoZSByZXF1ZXN0IGNhbiB0aGVuIGJlIHVzZWQgaW4gc3Vic2VxdWVudCBjYWxscyB0b1xuICAgKiBbW2V4ZWN1dGVdXSBhbmQgW1t1bnByZXBhcmVdXVxuICAgKlxuICAgKiBAcGFyYW0gcmVxdWVzdCBBIFtbUmVxdWVzdF1dIG9iamVjdCByZXByZXNlbnRpbmcgdGhlIHJlcXVlc3QuXG4gICAqICAgUGFyYW1ldGVycyBvbmx5IHJlcXVpcmUgYSBuYW1lIGFuZCB0eXBlLiBQYXJhbWV0ZXIgdmFsdWVzIGFyZSBpZ25vcmVkLlxuICAgKi9cbiAgcHJlcGFyZShyZXF1ZXN0OiBSZXF1ZXN0KSB7XG4gICAgY29uc3QgcGFyYW1ldGVyczogUGFyYW1ldGVyW10gPSBbXTtcblxuICAgIHBhcmFtZXRlcnMucHVzaCh7XG4gICAgICB0eXBlOiBUWVBFUy5JbnQsXG4gICAgICBuYW1lOiAnaGFuZGxlJyxcbiAgICAgIHZhbHVlOiB1bmRlZmluZWQsXG4gICAgICBvdXRwdXQ6IHRydWUsXG4gICAgICBsZW5ndGg6IHVuZGVmaW5lZCxcbiAgICAgIHByZWNpc2lvbjogdW5kZWZpbmVkLFxuICAgICAgc2NhbGU6IHVuZGVmaW5lZFxuICAgIH0pO1xuXG4gICAgcGFyYW1ldGVycy5wdXNoKHtcbiAgICAgIHR5cGU6IFRZUEVTLk5WYXJDaGFyLFxuICAgICAgbmFtZTogJ3BhcmFtcycsXG4gICAgICB2YWx1ZTogcmVxdWVzdC5wYXJhbWV0ZXJzLmxlbmd0aCA/IHJlcXVlc3QubWFrZVBhcmFtc1BhcmFtZXRlcihyZXF1ZXN0LnBhcmFtZXRlcnMpIDogbnVsbCxcbiAgICAgIG91dHB1dDogZmFsc2UsXG4gICAgICBsZW5ndGg6IHVuZGVmaW5lZCxcbiAgICAgIHByZWNpc2lvbjogdW5kZWZpbmVkLFxuICAgICAgc2NhbGU6IHVuZGVmaW5lZFxuICAgIH0pO1xuXG4gICAgcGFyYW1ldGVycy5wdXNoKHtcbiAgICAgIHR5cGU6IFRZUEVTLk5WYXJDaGFyLFxuICAgICAgbmFtZTogJ3N0bXQnLFxuICAgICAgdmFsdWU6IHJlcXVlc3Quc3FsVGV4dE9yUHJvY2VkdXJlLFxuICAgICAgb3V0cHV0OiBmYWxzZSxcbiAgICAgIGxlbmd0aDogdW5kZWZpbmVkLFxuICAgICAgcHJlY2lzaW9uOiB1bmRlZmluZWQsXG4gICAgICBzY2FsZTogdW5kZWZpbmVkXG4gICAgfSk7XG5cbiAgICByZXF1ZXN0LnByZXBhcmluZyA9IHRydWU7XG5cbiAgICAvLyBUT0RPOiBXZSBuZWVkIHRvIGNsZWFuIHVwIHRoaXMgZXZlbnQgaGFuZGxlciwgb3RoZXJ3aXNlIHRoaXMgbGVha3MgbWVtb3J5XG4gICAgcmVxdWVzdC5vbigncmV0dXJuVmFsdWUnLCAobmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KSA9PiB7XG4gICAgICBpZiAobmFtZSA9PT0gJ2hhbmRsZScpIHtcbiAgICAgICAgcmVxdWVzdC5oYW5kbGUgPSB2YWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlcXVlc3QuZXJyb3IgPSBuZXcgUmVxdWVzdEVycm9yKGBUZWRpb3VzID4gVW5leHBlY3RlZCBvdXRwdXQgcGFyYW1ldGVyICR7bmFtZX0gZnJvbSBzcF9wcmVwYXJlYCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLm1ha2VSZXF1ZXN0KHJlcXVlc3QsIFRZUEUuUlBDX1JFUVVFU1QsIG5ldyBScGNSZXF1ZXN0UGF5bG9hZChQcm9jZWR1cmVzLlNwX1ByZXBhcmUsIHBhcmFtZXRlcnMsIHRoaXMuY3VycmVudFRyYW5zYWN0aW9uRGVzY3JpcHRvcigpLCB0aGlzLmNvbmZpZy5vcHRpb25zLCB0aGlzLmRhdGFiYXNlQ29sbGF0aW9uKSk7XG4gIH1cblxuICAvKipcbiAgICogUmVsZWFzZSB0aGUgU1FMIFNlcnZlciByZXNvdXJjZXMgYXNzb2NpYXRlZCB3aXRoIGEgcHJldmlvdXNseSBwcmVwYXJlZCByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0gcmVxdWVzdCBBIFtbUmVxdWVzdF1dIG9iamVjdCByZXByZXNlbnRpbmcgdGhlIHJlcXVlc3QuXG4gICAqICAgUGFyYW1ldGVycyBvbmx5IHJlcXVpcmUgYSBuYW1lIGFuZCB0eXBlLlxuICAgKiAgIFBhcmFtZXRlciB2YWx1ZXMgYXJlIGlnbm9yZWQuXG4gICAqL1xuICB1bnByZXBhcmUocmVxdWVzdDogUmVxdWVzdCkge1xuICAgIGNvbnN0IHBhcmFtZXRlcnM6IFBhcmFtZXRlcltdID0gW107XG5cbiAgICBwYXJhbWV0ZXJzLnB1c2goe1xuICAgICAgdHlwZTogVFlQRVMuSW50LFxuICAgICAgbmFtZTogJ2hhbmRsZScsXG4gICAgICAvLyBUT0RPOiBBYm9ydCBpZiBgcmVxdWVzdC5oYW5kbGVgIGlzIG5vdCBzZXRcbiAgICAgIHZhbHVlOiByZXF1ZXN0LmhhbmRsZSxcbiAgICAgIG91dHB1dDogZmFsc2UsXG4gICAgICBsZW5ndGg6IHVuZGVmaW5lZCxcbiAgICAgIHByZWNpc2lvbjogdW5kZWZpbmVkLFxuICAgICAgc2NhbGU6IHVuZGVmaW5lZFxuICAgIH0pO1xuXG4gICAgdGhpcy5tYWtlUmVxdWVzdChyZXF1ZXN0LCBUWVBFLlJQQ19SRVFVRVNULCBuZXcgUnBjUmVxdWVzdFBheWxvYWQoUHJvY2VkdXJlcy5TcF9VbnByZXBhcmUsIHBhcmFtZXRlcnMsIHRoaXMuY3VycmVudFRyYW5zYWN0aW9uRGVzY3JpcHRvcigpLCB0aGlzLmNvbmZpZy5vcHRpb25zLCB0aGlzLmRhdGFiYXNlQ29sbGF0aW9uKSk7XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZSBwcmV2aW91c2x5IHByZXBhcmVkIFNRTCwgdXNpbmcgdGhlIHN1cHBsaWVkIHBhcmFtZXRlcnMuXG4gICAqXG4gICAqIEBwYXJhbSByZXF1ZXN0IEEgcHJldmlvdXNseSBwcmVwYXJlZCBbW1JlcXVlc3RdXS5cbiAgICogQHBhcmFtIHBhcmFtZXRlcnMgIEFuIG9iamVjdCB3aG9zZSBuYW1lcyBjb3JyZXNwb25kIHRvIHRoZSBuYW1lcyBvZlxuICAgKiAgIHBhcmFtZXRlcnMgdGhhdCB3ZXJlIGFkZGVkIHRvIHRoZSBbW1JlcXVlc3RdXSBiZWZvcmUgaXQgd2FzIHByZXBhcmVkLlxuICAgKiAgIFRoZSBvYmplY3QncyB2YWx1ZXMgYXJlIHBhc3NlZCBhcyB0aGUgcGFyYW1ldGVycycgdmFsdWVzIHdoZW4gdGhlXG4gICAqICAgcmVxdWVzdCBpcyBleGVjdXRlZC5cbiAgICovXG4gIGV4ZWN1dGUocmVxdWVzdDogUmVxdWVzdCwgcGFyYW1ldGVycz86IHsgW2tleTogc3RyaW5nXTogdW5rbm93biB9KSB7XG4gICAgY29uc3QgZXhlY3V0ZVBhcmFtZXRlcnM6IFBhcmFtZXRlcltdID0gW107XG5cbiAgICBleGVjdXRlUGFyYW1ldGVycy5wdXNoKHtcbiAgICAgIHR5cGU6IFRZUEVTLkludCxcbiAgICAgIG5hbWU6ICcnLFxuICAgICAgLy8gVE9ETzogQWJvcnQgaWYgYHJlcXVlc3QuaGFuZGxlYCBpcyBub3Qgc2V0XG4gICAgICB2YWx1ZTogcmVxdWVzdC5oYW5kbGUsXG4gICAgICBvdXRwdXQ6IGZhbHNlLFxuICAgICAgbGVuZ3RoOiB1bmRlZmluZWQsXG4gICAgICBwcmVjaXNpb246IHVuZGVmaW5lZCxcbiAgICAgIHNjYWxlOiB1bmRlZmluZWRcbiAgICB9KTtcblxuICAgIHRyeSB7XG4gICAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gcmVxdWVzdC5wYXJhbWV0ZXJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHBhcmFtZXRlciA9IHJlcXVlc3QucGFyYW1ldGVyc1tpXTtcblxuICAgICAgICBleGVjdXRlUGFyYW1ldGVycy5wdXNoKHtcbiAgICAgICAgICAuLi5wYXJhbWV0ZXIsXG4gICAgICAgICAgdmFsdWU6IHBhcmFtZXRlci50eXBlLnZhbGlkYXRlKHBhcmFtZXRlcnMgPyBwYXJhbWV0ZXJzW3BhcmFtZXRlci5uYW1lXSA6IG51bGwsIHRoaXMuZGF0YWJhc2VDb2xsYXRpb24pXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIHJlcXVlc3QuZXJyb3IgPSBlcnJvcjtcblxuICAgICAgcHJvY2Vzcy5uZXh0VGljaygoKSA9PiB7XG4gICAgICAgIHRoaXMuZGVidWcubG9nKGVycm9yLm1lc3NhZ2UpO1xuICAgICAgICByZXF1ZXN0LmNhbGxiYWNrKGVycm9yKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5tYWtlUmVxdWVzdChyZXF1ZXN0LCBUWVBFLlJQQ19SRVFVRVNULCBuZXcgUnBjUmVxdWVzdFBheWxvYWQoUHJvY2VkdXJlcy5TcF9FeGVjdXRlLCBleGVjdXRlUGFyYW1ldGVycywgdGhpcy5jdXJyZW50VHJhbnNhY3Rpb25EZXNjcmlwdG9yKCksIHRoaXMuY29uZmlnLm9wdGlvbnMsIHRoaXMuZGF0YWJhc2VDb2xsYXRpb24pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsIGEgc3RvcmVkIHByb2NlZHVyZSByZXByZXNlbnRlZCBieSBbW1JlcXVlc3RdXS5cbiAgICpcbiAgICogQHBhcmFtIHJlcXVlc3QgQSBbW1JlcXVlc3RdXSBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSByZXF1ZXN0LlxuICAgKi9cbiAgY2FsbFByb2NlZHVyZShyZXF1ZXN0OiBSZXF1ZXN0KSB7XG4gICAgdHJ5IHtcbiAgICAgIHJlcXVlc3QudmFsaWRhdGVQYXJhbWV0ZXJzKHRoaXMuZGF0YWJhc2VDb2xsYXRpb24pO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIHJlcXVlc3QuZXJyb3IgPSBlcnJvcjtcblxuICAgICAgcHJvY2Vzcy5uZXh0VGljaygoKSA9PiB7XG4gICAgICAgIHRoaXMuZGVidWcubG9nKGVycm9yLm1lc3NhZ2UpO1xuICAgICAgICByZXF1ZXN0LmNhbGxiYWNrKGVycm9yKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5tYWtlUmVxdWVzdChyZXF1ZXN0LCBUWVBFLlJQQ19SRVFVRVNULCBuZXcgUnBjUmVxdWVzdFBheWxvYWQocmVxdWVzdC5zcWxUZXh0T3JQcm9jZWR1cmUhLCByZXF1ZXN0LnBhcmFtZXRlcnMsIHRoaXMuY3VycmVudFRyYW5zYWN0aW9uRGVzY3JpcHRvcigpLCB0aGlzLmNvbmZpZy5vcHRpb25zLCB0aGlzLmRhdGFiYXNlQ29sbGF0aW9uKSk7XG4gIH1cblxuICAvKipcbiAgICogU3RhcnQgYSB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGNhbGxiYWNrXG4gICAqIEBwYXJhbSBuYW1lIEEgc3RyaW5nIHJlcHJlc2VudGluZyBhIG5hbWUgdG8gYXNzb2NpYXRlIHdpdGggdGhlIHRyYW5zYWN0aW9uLlxuICAgKiAgIE9wdGlvbmFsLCBhbmQgZGVmYXVsdHMgdG8gYW4gZW1wdHkgc3RyaW5nLiBSZXF1aXJlZCB3aGVuIGBpc29sYXRpb25MZXZlbGBcbiAgICogICBpcyBwcmVzZW50LlxuICAgKiBAcGFyYW0gaXNvbGF0aW9uTGV2ZWwgVGhlIGlzb2xhdGlvbiBsZXZlbCB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyB0byBiZSBydW4gd2l0aC5cbiAgICpcbiAgICogICBUaGUgaXNvbGF0aW9uIGxldmVscyBhcmUgYXZhaWxhYmxlIGZyb20gYHJlcXVpcmUoJ3RlZGlvdXMnKS5JU09MQVRJT05fTEVWRUxgLlxuICAgKiAgICogYFJFQURfVU5DT01NSVRURURgXG4gICAqICAgKiBgUkVBRF9DT01NSVRURURgXG4gICAqICAgKiBgUkVQRUFUQUJMRV9SRUFEYFxuICAgKiAgICogYFNFUklBTElaQUJMRWBcbiAgICogICAqIGBTTkFQU0hPVGBcbiAgICpcbiAgICogICBPcHRpb25hbCwgYW5kIGRlZmF1bHRzIHRvIHRoZSBDb25uZWN0aW9uJ3MgaXNvbGF0aW9uIGxldmVsLlxuICAgKi9cbiAgYmVnaW5UcmFuc2FjdGlvbihjYWxsYmFjazogQmVnaW5UcmFuc2FjdGlvbkNhbGxiYWNrLCBuYW1lID0gJycsIGlzb2xhdGlvbkxldmVsID0gdGhpcy5jb25maWcub3B0aW9ucy5pc29sYXRpb25MZXZlbCkge1xuICAgIGFzc2VydFZhbGlkSXNvbGF0aW9uTGV2ZWwoaXNvbGF0aW9uTGV2ZWwsICdpc29sYXRpb25MZXZlbCcpO1xuXG4gICAgY29uc3QgdHJhbnNhY3Rpb24gPSBuZXcgVHJhbnNhY3Rpb24obmFtZSwgaXNvbGF0aW9uTGV2ZWwpO1xuXG4gICAgaWYgKHRoaXMuY29uZmlnLm9wdGlvbnMudGRzVmVyc2lvbiA8ICc3XzInKSB7XG4gICAgICByZXR1cm4gdGhpcy5leGVjU3FsQmF0Y2gobmV3IFJlcXVlc3QoJ1NFVCBUUkFOU0FDVElPTiBJU09MQVRJT04gTEVWRUwgJyArICh0cmFuc2FjdGlvbi5pc29sYXRpb25MZXZlbFRvVFNRTCgpKSArICc7QkVHSU4gVFJBTiAnICsgdHJhbnNhY3Rpb24ubmFtZSwgKGVycikgPT4ge1xuICAgICAgICB0aGlzLnRyYW5zYWN0aW9uRGVwdGgrKztcbiAgICAgICAgaWYgKHRoaXMudHJhbnNhY3Rpb25EZXB0aCA9PT0gMSkge1xuICAgICAgICAgIHRoaXMuaW5UcmFuc2FjdGlvbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgIH0pKTtcbiAgICB9XG5cbiAgICBjb25zdCByZXF1ZXN0ID0gbmV3IFJlcXVlc3QodW5kZWZpbmVkLCAoZXJyKSA9PiB7XG4gICAgICByZXR1cm4gY2FsbGJhY2soZXJyLCB0aGlzLmN1cnJlbnRUcmFuc2FjdGlvbkRlc2NyaXB0b3IoKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXMubWFrZVJlcXVlc3QocmVxdWVzdCwgVFlQRS5UUkFOU0FDVElPTl9NQU5BR0VSLCB0cmFuc2FjdGlvbi5iZWdpblBheWxvYWQodGhpcy5jdXJyZW50VHJhbnNhY3Rpb25EZXNjcmlwdG9yKCkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21taXQgYSB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogVGhlcmUgc2hvdWxkIGJlIGFuIGFjdGl2ZSB0cmFuc2FjdGlvbiAtIHRoYXQgaXMsIFtbYmVnaW5UcmFuc2FjdGlvbl1dXG4gICAqIHNob3VsZCBoYXZlIGJlZW4gcHJldmlvdXNseSBjYWxsZWQuXG4gICAqXG4gICAqIEBwYXJhbSBjYWxsYmFja1xuICAgKiBAcGFyYW0gbmFtZSBBIHN0cmluZyByZXByZXNlbnRpbmcgYSBuYW1lIHRvIGFzc29jaWF0ZSB3aXRoIHRoZSB0cmFuc2FjdGlvbi5cbiAgICogICBPcHRpb25hbCwgYW5kIGRlZmF1bHRzIHRvIGFuIGVtcHR5IHN0cmluZy4gUmVxdWlyZWQgd2hlbiBgaXNvbGF0aW9uTGV2ZWxgaXMgcHJlc2VudC5cbiAgICovXG4gIGNvbW1pdFRyYW5zYWN0aW9uKGNhbGxiYWNrOiBDb21taXRUcmFuc2FjdGlvbkNhbGxiYWNrLCBuYW1lID0gJycpIHtcbiAgICBjb25zdCB0cmFuc2FjdGlvbiA9IG5ldyBUcmFuc2FjdGlvbihuYW1lKTtcbiAgICBpZiAodGhpcy5jb25maWcub3B0aW9ucy50ZHNWZXJzaW9uIDwgJzdfMicpIHtcbiAgICAgIHJldHVybiB0aGlzLmV4ZWNTcWxCYXRjaChuZXcgUmVxdWVzdCgnQ09NTUlUIFRSQU4gJyArIHRyYW5zYWN0aW9uLm5hbWUsIChlcnIpID0+IHtcbiAgICAgICAgdGhpcy50cmFuc2FjdGlvbkRlcHRoLS07XG4gICAgICAgIGlmICh0aGlzLnRyYW5zYWN0aW9uRGVwdGggPT09IDApIHtcbiAgICAgICAgICB0aGlzLmluVHJhbnNhY3Rpb24gPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICB9KSk7XG4gICAgfVxuICAgIGNvbnN0IHJlcXVlc3QgPSBuZXcgUmVxdWVzdCh1bmRlZmluZWQsIGNhbGxiYWNrKTtcbiAgICByZXR1cm4gdGhpcy5tYWtlUmVxdWVzdChyZXF1ZXN0LCBUWVBFLlRSQU5TQUNUSU9OX01BTkFHRVIsIHRyYW5zYWN0aW9uLmNvbW1pdFBheWxvYWQodGhpcy5jdXJyZW50VHJhbnNhY3Rpb25EZXNjcmlwdG9yKCkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSb2xsYmFjayBhIHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBUaGVyZSBzaG91bGQgYmUgYW4gYWN0aXZlIHRyYW5zYWN0aW9uIC0gdGhhdCBpcywgW1tiZWdpblRyYW5zYWN0aW9uXV1cbiAgICogc2hvdWxkIGhhdmUgYmVlbiBwcmV2aW91c2x5IGNhbGxlZC5cbiAgICpcbiAgICogQHBhcmFtIGNhbGxiYWNrXG4gICAqIEBwYXJhbSBuYW1lIEEgc3RyaW5nIHJlcHJlc2VudGluZyBhIG5hbWUgdG8gYXNzb2NpYXRlIHdpdGggdGhlIHRyYW5zYWN0aW9uLlxuICAgKiAgIE9wdGlvbmFsLCBhbmQgZGVmYXVsdHMgdG8gYW4gZW1wdHkgc3RyaW5nLlxuICAgKiAgIFJlcXVpcmVkIHdoZW4gYGlzb2xhdGlvbkxldmVsYCBpcyBwcmVzZW50LlxuICAgKi9cbiAgcm9sbGJhY2tUcmFuc2FjdGlvbihjYWxsYmFjazogUm9sbGJhY2tUcmFuc2FjdGlvbkNhbGxiYWNrLCBuYW1lID0gJycpIHtcbiAgICBjb25zdCB0cmFuc2FjdGlvbiA9IG5ldyBUcmFuc2FjdGlvbihuYW1lKTtcbiAgICBpZiAodGhpcy5jb25maWcub3B0aW9ucy50ZHNWZXJzaW9uIDwgJzdfMicpIHtcbiAgICAgIHJldHVybiB0aGlzLmV4ZWNTcWxCYXRjaChuZXcgUmVxdWVzdCgnUk9MTEJBQ0sgVFJBTiAnICsgdHJhbnNhY3Rpb24ubmFtZSwgKGVycikgPT4ge1xuICAgICAgICB0aGlzLnRyYW5zYWN0aW9uRGVwdGgtLTtcbiAgICAgICAgaWYgKHRoaXMudHJhbnNhY3Rpb25EZXB0aCA9PT0gMCkge1xuICAgICAgICAgIHRoaXMuaW5UcmFuc2FjdGlvbiA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICB9KSk7XG4gICAgfVxuICAgIGNvbnN0IHJlcXVlc3QgPSBuZXcgUmVxdWVzdCh1bmRlZmluZWQsIGNhbGxiYWNrKTtcbiAgICByZXR1cm4gdGhpcy5tYWtlUmVxdWVzdChyZXF1ZXN0LCBUWVBFLlRSQU5TQUNUSU9OX01BTkFHRVIsIHRyYW5zYWN0aW9uLnJvbGxiYWNrUGF5bG9hZCh0aGlzLmN1cnJlbnRUcmFuc2FjdGlvbkRlc2NyaXB0b3IoKSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBhIHNhdmVwb2ludCB3aXRoaW4gYSB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogVGhlcmUgc2hvdWxkIGJlIGFuIGFjdGl2ZSB0cmFuc2FjdGlvbiAtIHRoYXQgaXMsIFtbYmVnaW5UcmFuc2FjdGlvbl1dXG4gICAqIHNob3VsZCBoYXZlIGJlZW4gcHJldmlvdXNseSBjYWxsZWQuXG4gICAqXG4gICAqIEBwYXJhbSBjYWxsYmFja1xuICAgKiBAcGFyYW0gbmFtZSBBIHN0cmluZyByZXByZXNlbnRpbmcgYSBuYW1lIHRvIGFzc29jaWF0ZSB3aXRoIHRoZSB0cmFuc2FjdGlvbi5cXFxuICAgKiAgIE9wdGlvbmFsLCBhbmQgZGVmYXVsdHMgdG8gYW4gZW1wdHkgc3RyaW5nLlxuICAgKiAgIFJlcXVpcmVkIHdoZW4gYGlzb2xhdGlvbkxldmVsYCBpcyBwcmVzZW50LlxuICAgKi9cbiAgc2F2ZVRyYW5zYWN0aW9uKGNhbGxiYWNrOiBTYXZlVHJhbnNhY3Rpb25DYWxsYmFjaywgbmFtZTogc3RyaW5nKSB7XG4gICAgY29uc3QgdHJhbnNhY3Rpb24gPSBuZXcgVHJhbnNhY3Rpb24obmFtZSk7XG4gICAgaWYgKHRoaXMuY29uZmlnLm9wdGlvbnMudGRzVmVyc2lvbiA8ICc3XzInKSB7XG4gICAgICByZXR1cm4gdGhpcy5leGVjU3FsQmF0Y2gobmV3IFJlcXVlc3QoJ1NBVkUgVFJBTiAnICsgdHJhbnNhY3Rpb24ubmFtZSwgKGVycikgPT4ge1xuICAgICAgICB0aGlzLnRyYW5zYWN0aW9uRGVwdGgrKztcbiAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgIH0pKTtcbiAgICB9XG4gICAgY29uc3QgcmVxdWVzdCA9IG5ldyBSZXF1ZXN0KHVuZGVmaW5lZCwgY2FsbGJhY2spO1xuICAgIHJldHVybiB0aGlzLm1ha2VSZXF1ZXN0KHJlcXVlc3QsIFRZUEUuVFJBTlNBQ1RJT05fTUFOQUdFUiwgdHJhbnNhY3Rpb24uc2F2ZVBheWxvYWQodGhpcy5jdXJyZW50VHJhbnNhY3Rpb25EZXNjcmlwdG9yKCkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gdGhlIGdpdmVuIGNhbGxiYWNrIGFmdGVyIHN0YXJ0aW5nIGEgdHJhbnNhY3Rpb24sIGFuZCBjb21taXQgb3JcbiAgICogcm9sbGJhY2sgdGhlIHRyYW5zYWN0aW9uIGFmdGVyd2FyZHMuXG4gICAqXG4gICAqIFRoaXMgaXMgYSBoZWxwZXIgdGhhdCBlbXBsb3lzIFtbYmVnaW5UcmFuc2FjdGlvbl1dLCBbW2NvbW1pdFRyYW5zYWN0aW9uXV0sXG4gICAqIFtbcm9sbGJhY2tUcmFuc2FjdGlvbl1dLCBhbmQgW1tzYXZlVHJhbnNhY3Rpb25dXSB0byBncmVhdGx5IHNpbXBsaWZ5IHRoZVxuICAgKiB1c2Ugb2YgZGF0YWJhc2UgdHJhbnNhY3Rpb25zIGFuZCBhdXRvbWF0aWNhbGx5IGhhbmRsZSB0cmFuc2FjdGlvbiBuZXN0aW5nLlxuICAgKlxuICAgKiBAcGFyYW0gY2JcbiAgICogQHBhcmFtIGlzb2xhdGlvbkxldmVsXG4gICAqICAgVGhlIGlzb2xhdGlvbiBsZXZlbCB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyB0byBiZSBydW4gd2l0aC5cbiAgICpcbiAgICogICBUaGUgaXNvbGF0aW9uIGxldmVscyBhcmUgYXZhaWxhYmxlIGZyb20gYHJlcXVpcmUoJ3RlZGlvdXMnKS5JU09MQVRJT05fTEVWRUxgLlxuICAgKiAgICogYFJFQURfVU5DT01NSVRURURgXG4gICAqICAgKiBgUkVBRF9DT01NSVRURURgXG4gICAqICAgKiBgUkVQRUFUQUJMRV9SRUFEYFxuICAgKiAgICogYFNFUklBTElaQUJMRWBcbiAgICogICAqIGBTTkFQU0hPVGBcbiAgICpcbiAgICogICBPcHRpb25hbCwgYW5kIGRlZmF1bHRzIHRvIHRoZSBDb25uZWN0aW9uJ3MgaXNvbGF0aW9uIGxldmVsLlxuICAgKi9cbiAgdHJhbnNhY3Rpb24oY2I6IChlcnI6IEVycm9yIHwgbnVsbCB8IHVuZGVmaW5lZCwgdHhEb25lPzogPFQgZXh0ZW5kcyBUcmFuc2FjdGlvbkRvbmVDYWxsYmFjaz4oZXJyOiBFcnJvciB8IG51bGwgfCB1bmRlZmluZWQsIGRvbmU6IFQsIC4uLmFyZ3M6IENhbGxiYWNrUGFyYW1ldGVyczxUPikgPT4gdm9pZCkgPT4gdm9pZCwgaXNvbGF0aW9uTGV2ZWw/OiB0eXBlb2YgSVNPTEFUSU9OX0xFVkVMW2tleW9mIHR5cGVvZiBJU09MQVRJT05fTEVWRUxdKSB7XG4gICAgaWYgKHR5cGVvZiBjYiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignYGNiYCBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgICB9XG5cbiAgICBjb25zdCB1c2VTYXZlcG9pbnQgPSB0aGlzLmluVHJhbnNhY3Rpb247XG4gICAgY29uc3QgbmFtZSA9ICdfdGVkaW91c18nICsgKGNyeXB0by5yYW5kb21CeXRlcygxMCkudG9TdHJpbmcoJ2hleCcpKTtcbiAgICBjb25zdCB0eERvbmU6IDxUIGV4dGVuZHMgVHJhbnNhY3Rpb25Eb25lQ2FsbGJhY2s+KGVycjogRXJyb3IgfCBudWxsIHwgdW5kZWZpbmVkLCBkb25lOiBULCAuLi5hcmdzOiBDYWxsYmFja1BhcmFtZXRlcnM8VD4pID0+IHZvaWQgPSAoZXJyLCBkb25lLCAuLi5hcmdzKSA9PiB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGlmICh0aGlzLmluVHJhbnNhY3Rpb24gJiYgdGhpcy5zdGF0ZSA9PT0gdGhpcy5TVEFURS5MT0dHRURfSU4pIHtcbiAgICAgICAgICB0aGlzLnJvbGxiYWNrVHJhbnNhY3Rpb24oKHR4RXJyKSA9PiB7XG4gICAgICAgICAgICBkb25lKHR4RXJyIHx8IGVyciwgLi4uYXJncyk7XG4gICAgICAgICAgfSwgbmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZG9uZShlcnIsIC4uLmFyZ3MpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHVzZVNhdmVwb2ludCkge1xuICAgICAgICBpZiAodGhpcy5jb25maWcub3B0aW9ucy50ZHNWZXJzaW9uIDwgJzdfMicpIHtcbiAgICAgICAgICB0aGlzLnRyYW5zYWN0aW9uRGVwdGgtLTtcbiAgICAgICAgfVxuICAgICAgICBkb25lKG51bGwsIC4uLmFyZ3MpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jb21taXRUcmFuc2FjdGlvbigodHhFcnIpID0+IHtcbiAgICAgICAgICBkb25lKHR4RXJyLCAuLi5hcmdzKTtcbiAgICAgICAgfSwgbmFtZSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGlmICh1c2VTYXZlcG9pbnQpIHtcbiAgICAgIHJldHVybiB0aGlzLnNhdmVUcmFuc2FjdGlvbigoZXJyKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZXR1cm4gY2IoZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc29sYXRpb25MZXZlbCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmV4ZWNTcWxCYXRjaChuZXcgUmVxdWVzdCgnU0VUIHRyYW5zYWN0aW9uIGlzb2xhdGlvbiBsZXZlbCAnICsgdGhpcy5nZXRJc29sYXRpb25MZXZlbFRleHQoaXNvbGF0aW9uTGV2ZWwpLCAoZXJyKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gY2IoZXJyLCB0eERvbmUpO1xuICAgICAgICAgIH0pKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gY2IobnVsbCwgdHhEb25lKTtcbiAgICAgICAgfVxuICAgICAgfSwgbmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLmJlZ2luVHJhbnNhY3Rpb24oKGVycikgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmV0dXJuIGNiKGVycik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2IobnVsbCwgdHhEb25lKTtcbiAgICAgIH0sIG5hbWUsIGlzb2xhdGlvbkxldmVsKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIG1ha2VSZXF1ZXN0KHJlcXVlc3Q6IFJlcXVlc3QgfCBCdWxrTG9hZCwgcGFja2V0VHlwZTogbnVtYmVyLCBwYXlsb2FkOiAoSXRlcmFibGU8QnVmZmVyPiB8IEFzeW5jSXRlcmFibGU8QnVmZmVyPikgJiB7IHRvU3RyaW5nOiAoaW5kZW50Pzogc3RyaW5nKSA9PiBzdHJpbmcgfSkge1xuICAgIGlmICh0aGlzLnN0YXRlICE9PSB0aGlzLlNUQVRFLkxPR0dFRF9JTikge1xuICAgICAgY29uc3QgbWVzc2FnZSA9ICdSZXF1ZXN0cyBjYW4gb25seSBiZSBtYWRlIGluIHRoZSAnICsgdGhpcy5TVEFURS5MT0dHRURfSU4ubmFtZSArICcgc3RhdGUsIG5vdCB0aGUgJyArIHRoaXMuc3RhdGUubmFtZSArICcgc3RhdGUnO1xuICAgICAgdGhpcy5kZWJ1Zy5sb2cobWVzc2FnZSk7XG4gICAgICByZXF1ZXN0LmNhbGxiYWNrKG5ldyBSZXF1ZXN0RXJyb3IobWVzc2FnZSwgJ0VJTlZBTElEU1RBVEUnKSk7XG4gICAgfSBlbHNlIGlmIChyZXF1ZXN0LmNhbmNlbGVkKSB7XG4gICAgICBwcm9jZXNzLm5leHRUaWNrKCgpID0+IHtcbiAgICAgICAgcmVxdWVzdC5jYWxsYmFjayhuZXcgUmVxdWVzdEVycm9yKCdDYW5jZWxlZC4nLCAnRUNBTkNFTCcpKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAocGFja2V0VHlwZSA9PT0gVFlQRS5TUUxfQkFUQ0gpIHtcbiAgICAgICAgdGhpcy5pc1NxbEJhdGNoID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuaXNTcWxCYXRjaCA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnJlcXVlc3QgPSByZXF1ZXN0O1xuICAgICAgcmVxdWVzdC5jb25uZWN0aW9uISA9IHRoaXM7XG4gICAgICByZXF1ZXN0LnJvd0NvdW50ISA9IDA7XG4gICAgICByZXF1ZXN0LnJvd3MhID0gW107XG4gICAgICByZXF1ZXN0LnJzdCEgPSBbXTtcblxuICAgICAgY29uc3Qgb25DYW5jZWwgPSAoKSA9PiB7XG4gICAgICAgIHBheWxvYWRTdHJlYW0udW5waXBlKG1lc3NhZ2UpO1xuICAgICAgICBwYXlsb2FkU3RyZWFtLmRlc3Ryb3kobmV3IFJlcXVlc3RFcnJvcignQ2FuY2VsZWQuJywgJ0VDQU5DRUwnKSk7XG5cbiAgICAgICAgLy8gc2V0IHRoZSBpZ25vcmUgYml0IGFuZCBlbmQgdGhlIG1lc3NhZ2UuXG4gICAgICAgIG1lc3NhZ2UuaWdub3JlID0gdHJ1ZTtcbiAgICAgICAgbWVzc2FnZS5lbmQoKTtcblxuICAgICAgICBpZiAocmVxdWVzdCBpbnN0YW5jZW9mIFJlcXVlc3QgJiYgcmVxdWVzdC5wYXVzZWQpIHtcbiAgICAgICAgICAvLyByZXN1bWUgdGhlIHJlcXVlc3QgaWYgaXQgd2FzIHBhdXNlZCBzbyB3ZSBjYW4gcmVhZCB0aGUgcmVtYWluaW5nIHRva2Vuc1xuICAgICAgICAgIHJlcXVlc3QucmVzdW1lKCk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHJlcXVlc3Qub25jZSgnY2FuY2VsJywgb25DYW5jZWwpO1xuXG4gICAgICB0aGlzLmNyZWF0ZVJlcXVlc3RUaW1lcigpO1xuXG4gICAgICBjb25zdCBtZXNzYWdlID0gbmV3IE1lc3NhZ2UoeyB0eXBlOiBwYWNrZXRUeXBlLCByZXNldENvbm5lY3Rpb246IHRoaXMucmVzZXRDb25uZWN0aW9uT25OZXh0UmVxdWVzdCB9KTtcbiAgICAgIHRoaXMubWVzc2FnZUlvLm91dGdvaW5nTWVzc2FnZVN0cmVhbS53cml0ZShtZXNzYWdlKTtcbiAgICAgIHRoaXMudHJhbnNpdGlvblRvKHRoaXMuU1RBVEUuU0VOVF9DTElFTlRfUkVRVUVTVCk7XG5cbiAgICAgIG1lc3NhZ2Uub25jZSgnZmluaXNoJywgKCkgPT4ge1xuICAgICAgICByZXF1ZXN0LnJlbW92ZUxpc3RlbmVyKCdjYW5jZWwnLCBvbkNhbmNlbCk7XG4gICAgICAgIHJlcXVlc3Qub25jZSgnY2FuY2VsJywgdGhpcy5fY2FuY2VsQWZ0ZXJSZXF1ZXN0U2VudCk7XG5cbiAgICAgICAgdGhpcy5yZXNldENvbm5lY3Rpb25Pbk5leHRSZXF1ZXN0ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZGVidWcucGF5bG9hZChmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gcGF5bG9hZCEudG9TdHJpbmcoJyAgJyk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHBheWxvYWRTdHJlYW0gPSBSZWFkYWJsZS5mcm9tKHBheWxvYWQpO1xuICAgICAgcGF5bG9hZFN0cmVhbS5vbmNlKCdlcnJvcicsIChlcnJvcikgPT4ge1xuICAgICAgICBwYXlsb2FkU3RyZWFtLnVucGlwZShtZXNzYWdlKTtcblxuICAgICAgICAvLyBPbmx5IHNldCBhIHJlcXVlc3QgZXJyb3IgaWYgbm8gZXJyb3Igd2FzIHNldCB5ZXQuXG4gICAgICAgIHJlcXVlc3QuZXJyb3IgPz89IGVycm9yO1xuXG4gICAgICAgIG1lc3NhZ2UuaWdub3JlID0gdHJ1ZTtcbiAgICAgICAgbWVzc2FnZS5lbmQoKTtcbiAgICAgIH0pO1xuICAgICAgcGF5bG9hZFN0cmVhbS5waXBlKG1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDYW5jZWwgY3VycmVudGx5IGV4ZWN1dGVkIHJlcXVlc3QuXG4gICAqL1xuICBjYW5jZWwoKSB7XG4gICAgaWYgKCF0aGlzLnJlcXVlc3QpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5yZXF1ZXN0LmNhbmNlbGVkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdGhpcy5yZXF1ZXN0LmNhbmNlbCgpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IHRoZSBjb25uZWN0aW9uIHRvIGl0cyBpbml0aWFsIHN0YXRlLlxuICAgKiBDYW4gYmUgdXNlZnVsIGZvciBjb25uZWN0aW9uIHBvb2wgaW1wbGVtZW50YXRpb25zLlxuICAgKlxuICAgKiBAcGFyYW0gY2FsbGJhY2tcbiAgICovXG4gIHJlc2V0KGNhbGxiYWNrOiBSZXNldENhbGxiYWNrKSB7XG4gICAgY29uc3QgcmVxdWVzdCA9IG5ldyBSZXF1ZXN0KHRoaXMuZ2V0SW5pdGlhbFNxbCgpLCAoZXJyKSA9PiB7XG4gICAgICBpZiAodGhpcy5jb25maWcub3B0aW9ucy50ZHNWZXJzaW9uIDwgJzdfMicpIHtcbiAgICAgICAgdGhpcy5pblRyYW5zYWN0aW9uID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBjYWxsYmFjayhlcnIpO1xuICAgIH0pO1xuICAgIHRoaXMucmVzZXRDb25uZWN0aW9uT25OZXh0UmVxdWVzdCA9IHRydWU7XG4gICAgdGhpcy5leGVjU3FsQmF0Y2gocmVxdWVzdCk7XG4gIH1cblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGN1cnJlbnRUcmFuc2FjdGlvbkRlc2NyaXB0b3IoKSB7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNhY3Rpb25EZXNjcmlwdG9yc1t0aGlzLnRyYW5zYWN0aW9uRGVzY3JpcHRvcnMubGVuZ3RoIC0gMV07XG4gIH1cblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGdldElzb2xhdGlvbkxldmVsVGV4dChpc29sYXRpb25MZXZlbDogdHlwZW9mIElTT0xBVElPTl9MRVZFTFtrZXlvZiB0eXBlb2YgSVNPTEFUSU9OX0xFVkVMXSkge1xuICAgIHN3aXRjaCAoaXNvbGF0aW9uTGV2ZWwpIHtcbiAgICAgIGNhc2UgSVNPTEFUSU9OX0xFVkVMLlJFQURfVU5DT01NSVRURUQ6XG4gICAgICAgIHJldHVybiAncmVhZCB1bmNvbW1pdHRlZCc7XG4gICAgICBjYXNlIElTT0xBVElPTl9MRVZFTC5SRVBFQVRBQkxFX1JFQUQ6XG4gICAgICAgIHJldHVybiAncmVwZWF0YWJsZSByZWFkJztcbiAgICAgIGNhc2UgSVNPTEFUSU9OX0xFVkVMLlNFUklBTElaQUJMRTpcbiAgICAgICAgcmV0dXJuICdzZXJpYWxpemFibGUnO1xuICAgICAgY2FzZSBJU09MQVRJT05fTEVWRUwuU05BUFNIT1Q6XG4gICAgICAgIHJldHVybiAnc25hcHNob3QnO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuICdyZWFkIGNvbW1pdHRlZCc7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGlzVHJhbnNpZW50RXJyb3IoZXJyb3I6IEFnZ3JlZ2F0ZUVycm9yIHwgQ29ubmVjdGlvbkVycm9yKTogYm9vbGVhbiB7XG4gIGlmIChlcnJvciBpbnN0YW5jZW9mIEFnZ3JlZ2F0ZUVycm9yKSB7XG4gICAgZXJyb3IgPSBlcnJvci5lcnJvcnNbMF07XG4gIH1cbiAgcmV0dXJuIChlcnJvciBpbnN0YW5jZW9mIENvbm5lY3Rpb25FcnJvcikgJiYgISFlcnJvci5pc1RyYW5zaWVudDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29ubmVjdGlvbjtcbm1vZHVsZS5leHBvcnRzID0gQ29ubmVjdGlvbjtcblxuQ29ubmVjdGlvbi5wcm90b3R5cGUuU1RBVEUgPSB7XG4gIElOSVRJQUxJWkVEOiB7XG4gICAgbmFtZTogJ0luaXRpYWxpemVkJyxcbiAgICBldmVudHM6IHt9XG4gIH0sXG4gIENPTk5FQ1RJTkc6IHtcbiAgICBuYW1lOiAnQ29ubmVjdGluZycsXG4gICAgZW50ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5pbml0aWFsaXNlQ29ubmVjdGlvbigpO1xuICAgIH0sXG4gICAgZXZlbnRzOiB7XG4gICAgICBzb2NrZXRFcnJvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMudHJhbnNpdGlvblRvKHRoaXMuU1RBVEUuRklOQUwpO1xuICAgICAgfSxcbiAgICAgIGNvbm5lY3RUaW1lb3V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy50cmFuc2l0aW9uVG8odGhpcy5TVEFURS5GSU5BTCk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBTRU5UX1BSRUxPR0lOOiB7XG4gICAgbmFtZTogJ1NlbnRQcmVsb2dpbicsXG4gICAgZW50ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgKGFzeW5jICgpID0+IHtcbiAgICAgICAgbGV0IG1lc3NhZ2VCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMCk7XG5cbiAgICAgICAgbGV0IG1lc3NhZ2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgbWVzc2FnZSA9IGF3YWl0IHRoaXMubWVzc2FnZUlvLnJlYWRNZXNzYWdlKCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuc29ja2V0RXJyb3IoZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciBhd2FpdCAoY29uc3QgZGF0YSBvZiBtZXNzYWdlKSB7XG4gICAgICAgICAgbWVzc2FnZUJ1ZmZlciA9IEJ1ZmZlci5jb25jYXQoW21lc3NhZ2VCdWZmZXIsIGRhdGFdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHByZWxvZ2luUGF5bG9hZCA9IG5ldyBQcmVsb2dpblBheWxvYWQobWVzc2FnZUJ1ZmZlcik7XG4gICAgICAgIHRoaXMuZGVidWcucGF5bG9hZChmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gcHJlbG9naW5QYXlsb2FkLnRvU3RyaW5nKCcgICcpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocHJlbG9naW5QYXlsb2FkLmZlZEF1dGhSZXF1aXJlZCA9PT0gMSkge1xuICAgICAgICAgIHRoaXMuZmVkQXV0aFJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ3N0cmljdCcgIT09IHRoaXMuY29uZmlnLm9wdGlvbnMuZW5jcnlwdCAmJiAocHJlbG9naW5QYXlsb2FkLmVuY3J5cHRpb25TdHJpbmcgPT09ICdPTicgfHwgcHJlbG9naW5QYXlsb2FkLmVuY3J5cHRpb25TdHJpbmcgPT09ICdSRVEnKSkge1xuICAgICAgICAgIGlmICghdGhpcy5jb25maWcub3B0aW9ucy5lbmNyeXB0KSB7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2Nvbm5lY3QnLCBuZXcgQ29ubmVjdGlvbkVycm9yKFwiU2VydmVyIHJlcXVpcmVzIGVuY3J5cHRpb24sIHNldCAnZW5jcnlwdCcgY29uZmlnIG9wdGlvbiB0byB0cnVlLlwiLCAnRUVOQ1JZUFQnKSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jbG9zZSgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25Ubyh0aGlzLlNUQVRFLlNFTlRfVExTU1NMTkVHT1RJQVRJT04pO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5tZXNzYWdlSW8uc3RhcnRUbHModGhpcy5zZWN1cmVDb250ZXh0T3B0aW9ucywgdGhpcy5jb25maWcub3B0aW9ucy5zZXJ2ZXJOYW1lID8gdGhpcy5jb25maWcub3B0aW9ucy5zZXJ2ZXJOYW1lIDogdGhpcy5yb3V0aW5nRGF0YT8uc2VydmVyID8/IHRoaXMuY29uZmlnLnNlcnZlciwgdGhpcy5jb25maWcub3B0aW9ucy50cnVzdFNlcnZlckNlcnRpZmljYXRlKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc29ja2V0RXJyb3IoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNlbmRMb2dpbjdQYWNrZXQoKTtcblxuICAgICAgICBjb25zdCB7IGF1dGhlbnRpY2F0aW9uIH0gPSB0aGlzLmNvbmZpZztcblxuICAgICAgICBzd2l0Y2ggKGF1dGhlbnRpY2F0aW9uLnR5cGUpIHtcbiAgICAgICAgICBjYXNlICdhenVyZS1hY3RpdmUtZGlyZWN0b3J5LXBhc3N3b3JkJzpcbiAgICAgICAgICBjYXNlICdhenVyZS1hY3RpdmUtZGlyZWN0b3J5LW1zaS12bSc6XG4gICAgICAgICAgY2FzZSAnYXp1cmUtYWN0aXZlLWRpcmVjdG9yeS1tc2ktYXBwLXNlcnZpY2UnOlxuICAgICAgICAgIGNhc2UgJ2F6dXJlLWFjdGl2ZS1kaXJlY3Rvcnktc2VydmljZS1wcmluY2lwYWwtc2VjcmV0JzpcbiAgICAgICAgICBjYXNlICdhenVyZS1hY3RpdmUtZGlyZWN0b3J5LWRlZmF1bHQnOlxuICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uVG8odGhpcy5TVEFURS5TRU5UX0xPR0lON19XSVRIX0ZFREFVVEgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnbnRsbSc6XG4gICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25Ubyh0aGlzLlNUQVRFLlNFTlRfTE9HSU43X1dJVEhfTlRMTSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uVG8odGhpcy5TVEFURS5TRU5UX0xPR0lON19XSVRIX1NUQU5EQVJEX0xPR0lOKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9KSgpLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgcHJvY2Vzcy5uZXh0VGljaygoKSA9PiB7XG4gICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZXZlbnRzOiB7XG4gICAgICBzb2NrZXRFcnJvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMudHJhbnNpdGlvblRvKHRoaXMuU1RBVEUuRklOQUwpO1xuICAgICAgfSxcbiAgICAgIGNvbm5lY3RUaW1lb3V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy50cmFuc2l0aW9uVG8odGhpcy5TVEFURS5GSU5BTCk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBSRVJPVVRJTkc6IHtcbiAgICBuYW1lOiAnUmVSb3V0aW5nJyxcbiAgICBlbnRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLmNsZWFudXBDb25uZWN0aW9uKENMRUFOVVBfVFlQRS5SRURJUkVDVCk7XG4gICAgfSxcbiAgICBldmVudHM6IHtcbiAgICAgIG1lc3NhZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgfSxcbiAgICAgIHNvY2tldEVycm9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy50cmFuc2l0aW9uVG8odGhpcy5TVEFURS5GSU5BTCk7XG4gICAgICB9LFxuICAgICAgY29ubmVjdFRpbWVvdXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnRyYW5zaXRpb25Ubyh0aGlzLlNUQVRFLkZJTkFMKTtcbiAgICAgIH0sXG4gICAgICByZWNvbm5lY3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnRyYW5zaXRpb25Ubyh0aGlzLlNUQVRFLkNPTk5FQ1RJTkcpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgVFJBTlNJRU5UX0ZBSUxVUkVfUkVUUlk6IHtcbiAgICBuYW1lOiAnVFJBTlNJRU5UX0ZBSUxVUkVfUkVUUlknLFxuICAgIGVudGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuY3VyVHJhbnNpZW50UmV0cnlDb3VudCsrO1xuICAgICAgdGhpcy5jbGVhbnVwQ29ubmVjdGlvbihDTEVBTlVQX1RZUEUuUkVUUlkpO1xuICAgIH0sXG4gICAgZXZlbnRzOiB7XG4gICAgICBtZXNzYWdlOiBmdW5jdGlvbigpIHtcbiAgICAgIH0sXG4gICAgICBzb2NrZXRFcnJvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMudHJhbnNpdGlvblRvKHRoaXMuU1RBVEUuRklOQUwpO1xuICAgICAgfSxcbiAgICAgIGNvbm5lY3RUaW1lb3V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy50cmFuc2l0aW9uVG8odGhpcy5TVEFURS5GSU5BTCk7XG4gICAgICB9LFxuICAgICAgcmV0cnk6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmNyZWF0ZVJldHJ5VGltZXIoKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIFNFTlRfVExTU1NMTkVHT1RJQVRJT046IHtcbiAgICBuYW1lOiAnU2VudFRMU1NTTE5lZ290aWF0aW9uJyxcbiAgICBldmVudHM6IHtcbiAgICAgIHNvY2tldEVycm9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy50cmFuc2l0aW9uVG8odGhpcy5TVEFURS5GSU5BTCk7XG4gICAgICB9LFxuICAgICAgY29ubmVjdFRpbWVvdXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnRyYW5zaXRpb25Ubyh0aGlzLlNUQVRFLkZJTkFMKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIFNFTlRfTE9HSU43X1dJVEhfU1RBTkRBUkRfTE9HSU46IHtcbiAgICBuYW1lOiAnU2VudExvZ2luN1dpdGhTdGFuZGFyZExvZ2luJyxcbiAgICBlbnRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgICBsZXQgbWVzc2FnZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBtZXNzYWdlID0gYXdhaXQgdGhpcy5tZXNzYWdlSW8ucmVhZE1lc3NhZ2UoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5zb2NrZXRFcnJvcihlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaGFuZGxlciA9IG5ldyBMb2dpbjdUb2tlbkhhbmRsZXIodGhpcyk7XG4gICAgICAgIGNvbnN0IHRva2VuU3RyZWFtUGFyc2VyID0gdGhpcy5jcmVhdGVUb2tlblN0cmVhbVBhcnNlcihtZXNzYWdlLCBoYW5kbGVyKTtcblxuICAgICAgICBhd2FpdCBvbmNlKHRva2VuU3RyZWFtUGFyc2VyLCAnZW5kJyk7XG5cbiAgICAgICAgaWYgKGhhbmRsZXIubG9naW5BY2tSZWNlaXZlZCkge1xuICAgICAgICAgIGlmIChoYW5kbGVyLnJvdXRpbmdEYXRhKSB7XG4gICAgICAgICAgICB0aGlzLnJvdXRpbmdEYXRhID0gaGFuZGxlci5yb3V0aW5nRGF0YTtcbiAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvblRvKHRoaXMuU1RBVEUuUkVST1VUSU5HKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uVG8odGhpcy5TVEFURS5MT0dHRURfSU5fU0VORElOR19JTklUSUFMX1NRTCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMubG9naW5FcnJvcikge1xuICAgICAgICAgIGlmIChpc1RyYW5zaWVudEVycm9yKHRoaXMubG9naW5FcnJvcikpIHtcbiAgICAgICAgICAgIHRoaXMuZGVidWcubG9nKCdJbml0aWF0aW5nIHJldHJ5IG9uIHRyYW5zaWVudCBlcnJvcicpO1xuICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uVG8odGhpcy5TVEFURS5UUkFOU0lFTlRfRkFJTFVSRV9SRVRSWSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnY29ubmVjdCcsIHRoaXMubG9naW5FcnJvcik7XG4gICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25Ubyh0aGlzLlNUQVRFLkZJTkFMKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5lbWl0KCdjb25uZWN0JywgbmV3IENvbm5lY3Rpb25FcnJvcignTG9naW4gZmFpbGVkLicsICdFTE9HSU4nKSk7XG4gICAgICAgICAgdGhpcy50cmFuc2l0aW9uVG8odGhpcy5TVEFURS5GSU5BTCk7XG4gICAgICAgIH1cbiAgICAgIH0pKCkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICBwcm9jZXNzLm5leHRUaWNrKCgpID0+IHtcbiAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBldmVudHM6IHtcbiAgICAgIHNvY2tldEVycm9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy50cmFuc2l0aW9uVG8odGhpcy5TVEFURS5GSU5BTCk7XG4gICAgICB9LFxuICAgICAgY29ubmVjdFRpbWVvdXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnRyYW5zaXRpb25Ubyh0aGlzLlNUQVRFLkZJTkFMKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIFNFTlRfTE9HSU43X1dJVEhfTlRMTToge1xuICAgIG5hbWU6ICdTZW50TG9naW43V2l0aE5UTE1Mb2dpbicsXG4gICAgZW50ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgKGFzeW5jICgpID0+IHtcbiAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICBsZXQgbWVzc2FnZTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgbWVzc2FnZSA9IGF3YWl0IHRoaXMubWVzc2FnZUlvLnJlYWRNZXNzYWdlKCk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNvY2tldEVycm9yKGVycik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgaGFuZGxlciA9IG5ldyBMb2dpbjdUb2tlbkhhbmRsZXIodGhpcyk7XG4gICAgICAgICAgY29uc3QgdG9rZW5TdHJlYW1QYXJzZXIgPSB0aGlzLmNyZWF0ZVRva2VuU3RyZWFtUGFyc2VyKG1lc3NhZ2UsIGhhbmRsZXIpO1xuXG4gICAgICAgICAgYXdhaXQgb25jZSh0b2tlblN0cmVhbVBhcnNlciwgJ2VuZCcpO1xuXG4gICAgICAgICAgaWYgKGhhbmRsZXIubG9naW5BY2tSZWNlaXZlZCkge1xuICAgICAgICAgICAgaWYgKGhhbmRsZXIucm91dGluZ0RhdGEpIHtcbiAgICAgICAgICAgICAgdGhpcy5yb3V0aW5nRGF0YSA9IGhhbmRsZXIucm91dGluZ0RhdGE7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLnRyYW5zaXRpb25Ubyh0aGlzLlNUQVRFLlJFUk9VVElORyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy50cmFuc2l0aW9uVG8odGhpcy5TVEFURS5MT0dHRURfSU5fU0VORElOR19JTklUSUFMX1NRTCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmICh0aGlzLm50bG1wYWNrZXQpIHtcbiAgICAgICAgICAgIGNvbnN0IGF1dGhlbnRpY2F0aW9uID0gdGhpcy5jb25maWcuYXV0aGVudGljYXRpb24gYXMgTnRsbUF1dGhlbnRpY2F0aW9uO1xuXG4gICAgICAgICAgICBjb25zdCBwYXlsb2FkID0gbmV3IE5UTE1SZXNwb25zZVBheWxvYWQoe1xuICAgICAgICAgICAgICBkb21haW46IGF1dGhlbnRpY2F0aW9uLm9wdGlvbnMuZG9tYWluLFxuICAgICAgICAgICAgICB1c2VyTmFtZTogYXV0aGVudGljYXRpb24ub3B0aW9ucy51c2VyTmFtZSxcbiAgICAgICAgICAgICAgcGFzc3dvcmQ6IGF1dGhlbnRpY2F0aW9uLm9wdGlvbnMucGFzc3dvcmQsXG4gICAgICAgICAgICAgIG50bG1wYWNrZXQ6IHRoaXMubnRsbXBhY2tldFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMubWVzc2FnZUlvLnNlbmRNZXNzYWdlKFRZUEUuTlRMTUFVVEhfUEtULCBwYXlsb2FkLmRhdGEpO1xuICAgICAgICAgICAgdGhpcy5kZWJ1Zy5wYXlsb2FkKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXR1cm4gcGF5bG9hZC50b1N0cmluZygnICAnKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB0aGlzLm50bG1wYWNrZXQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmxvZ2luRXJyb3IpIHtcbiAgICAgICAgICAgIGlmIChpc1RyYW5zaWVudEVycm9yKHRoaXMubG9naW5FcnJvcikpIHtcbiAgICAgICAgICAgICAgdGhpcy5kZWJ1Zy5sb2coJ0luaXRpYXRpbmcgcmV0cnkgb24gdHJhbnNpZW50IGVycm9yJyk7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLnRyYW5zaXRpb25Ubyh0aGlzLlNUQVRFLlRSQU5TSUVOVF9GQUlMVVJFX1JFVFJZKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMuZW1pdCgnY29ubmVjdCcsIHRoaXMubG9naW5FcnJvcik7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLnRyYW5zaXRpb25Ubyh0aGlzLlNUQVRFLkZJTkFMKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5lbWl0KCdjb25uZWN0JywgbmV3IENvbm5lY3Rpb25FcnJvcignTG9naW4gZmFpbGVkLicsICdFTE9HSU4nKSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy50cmFuc2l0aW9uVG8odGhpcy5TVEFURS5GSU5BTCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgIH0pKCkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICBwcm9jZXNzLm5leHRUaWNrKCgpID0+IHtcbiAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBldmVudHM6IHtcbiAgICAgIHNvY2tldEVycm9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy50cmFuc2l0aW9uVG8odGhpcy5TVEFURS5GSU5BTCk7XG4gICAgICB9LFxuICAgICAgY29ubmVjdFRpbWVvdXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnRyYW5zaXRpb25Ubyh0aGlzLlNUQVRFLkZJTkFMKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIFNFTlRfTE9HSU43X1dJVEhfRkVEQVVUSDoge1xuICAgIG5hbWU6ICdTZW50TG9naW43V2l0aGZlZGF1dGgnLFxuICAgIGVudGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIChhc3luYyAoKSA9PiB7XG4gICAgICAgIGxldCBtZXNzYWdlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIG1lc3NhZ2UgPSBhd2FpdCB0aGlzLm1lc3NhZ2VJby5yZWFkTWVzc2FnZSgpO1xuICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLnNvY2tldEVycm9yKGVycik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBoYW5kbGVyID0gbmV3IExvZ2luN1Rva2VuSGFuZGxlcih0aGlzKTtcbiAgICAgICAgY29uc3QgdG9rZW5TdHJlYW1QYXJzZXIgPSB0aGlzLmNyZWF0ZVRva2VuU3RyZWFtUGFyc2VyKG1lc3NhZ2UsIGhhbmRsZXIpO1xuICAgICAgICBhd2FpdCBvbmNlKHRva2VuU3RyZWFtUGFyc2VyLCAnZW5kJyk7XG4gICAgICAgIGlmIChoYW5kbGVyLmxvZ2luQWNrUmVjZWl2ZWQpIHtcbiAgICAgICAgICBpZiAoaGFuZGxlci5yb3V0aW5nRGF0YSkge1xuICAgICAgICAgICAgdGhpcy5yb3V0aW5nRGF0YSA9IGhhbmRsZXIucm91dGluZ0RhdGE7XG4gICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25Ubyh0aGlzLlNUQVRFLlJFUk9VVElORyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvblRvKHRoaXMuU1RBVEUuTE9HR0VEX0lOX1NFTkRJTkdfSU5JVElBTF9TUUwpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZlZEF1dGhJbmZvVG9rZW4gPSBoYW5kbGVyLmZlZEF1dGhJbmZvVG9rZW47XG5cbiAgICAgICAgaWYgKGZlZEF1dGhJbmZvVG9rZW4gJiYgZmVkQXV0aEluZm9Ub2tlbi5zdHN1cmwgJiYgZmVkQXV0aEluZm9Ub2tlbi5zcG4pIHtcbiAgICAgICAgICBjb25zdCBhdXRoZW50aWNhdGlvbiA9IHRoaXMuY29uZmlnLmF1dGhlbnRpY2F0aW9uIGFzIEF6dXJlQWN0aXZlRGlyZWN0b3J5UGFzc3dvcmRBdXRoZW50aWNhdGlvbiB8IEF6dXJlQWN0aXZlRGlyZWN0b3J5TXNpVm1BdXRoZW50aWNhdGlvbiB8IEF6dXJlQWN0aXZlRGlyZWN0b3J5TXNpQXBwU2VydmljZUF1dGhlbnRpY2F0aW9uIHwgQXp1cmVBY3RpdmVEaXJlY3RvcnlTZXJ2aWNlUHJpbmNpcGFsU2VjcmV0IHwgQXp1cmVBY3RpdmVEaXJlY3RvcnlEZWZhdWx0QXV0aGVudGljYXRpb247XG4gICAgICAgICAgY29uc3QgdG9rZW5TY29wZSA9IG5ldyBVUkwoJy8uZGVmYXVsdCcsIGZlZEF1dGhJbmZvVG9rZW4uc3BuKS50b1N0cmluZygpO1xuXG4gICAgICAgICAgbGV0IGNyZWRlbnRpYWxzO1xuXG4gICAgICAgICAgc3dpdGNoIChhdXRoZW50aWNhdGlvbi50eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdhenVyZS1hY3RpdmUtZGlyZWN0b3J5LXBhc3N3b3JkJzpcbiAgICAgICAgICAgICAgY3JlZGVudGlhbHMgPSBuZXcgVXNlcm5hbWVQYXNzd29yZENyZWRlbnRpYWwoXG4gICAgICAgICAgICAgICAgYXV0aGVudGljYXRpb24ub3B0aW9ucy50ZW5hbnRJZCA/PyAnY29tbW9uJyxcbiAgICAgICAgICAgICAgICBhdXRoZW50aWNhdGlvbi5vcHRpb25zLmNsaWVudElkLFxuICAgICAgICAgICAgICAgIGF1dGhlbnRpY2F0aW9uLm9wdGlvbnMudXNlck5hbWUsXG4gICAgICAgICAgICAgICAgYXV0aGVudGljYXRpb24ub3B0aW9ucy5wYXNzd29yZFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2F6dXJlLWFjdGl2ZS1kaXJlY3RvcnktbXNpLXZtJzpcbiAgICAgICAgICAgIGNhc2UgJ2F6dXJlLWFjdGl2ZS1kaXJlY3RvcnktbXNpLWFwcC1zZXJ2aWNlJzpcbiAgICAgICAgICAgICAgY29uc3QgbXNpQXJncyA9IGF1dGhlbnRpY2F0aW9uLm9wdGlvbnMuY2xpZW50SWQgPyBbYXV0aGVudGljYXRpb24ub3B0aW9ucy5jbGllbnRJZCwge31dIDogW3t9XTtcbiAgICAgICAgICAgICAgY3JlZGVudGlhbHMgPSBuZXcgTWFuYWdlZElkZW50aXR5Q3JlZGVudGlhbCguLi5tc2lBcmdzKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdhenVyZS1hY3RpdmUtZGlyZWN0b3J5LWRlZmF1bHQnOlxuICAgICAgICAgICAgICBjb25zdCBhcmdzID0gYXV0aGVudGljYXRpb24ub3B0aW9ucy5jbGllbnRJZCA/IHsgbWFuYWdlZElkZW50aXR5Q2xpZW50SWQ6IGF1dGhlbnRpY2F0aW9uLm9wdGlvbnMuY2xpZW50SWQgfSA6IHt9O1xuICAgICAgICAgICAgICBjcmVkZW50aWFscyA9IG5ldyBEZWZhdWx0QXp1cmVDcmVkZW50aWFsKGFyZ3MpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2F6dXJlLWFjdGl2ZS1kaXJlY3Rvcnktc2VydmljZS1wcmluY2lwYWwtc2VjcmV0JzpcbiAgICAgICAgICAgICAgY3JlZGVudGlhbHMgPSBuZXcgQ2xpZW50U2VjcmV0Q3JlZGVudGlhbChcbiAgICAgICAgICAgICAgICBhdXRoZW50aWNhdGlvbi5vcHRpb25zLnRlbmFudElkLFxuICAgICAgICAgICAgICAgIGF1dGhlbnRpY2F0aW9uLm9wdGlvbnMuY2xpZW50SWQsXG4gICAgICAgICAgICAgICAgYXV0aGVudGljYXRpb24ub3B0aW9ucy5jbGllbnRTZWNyZXRcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IHRva2VuUmVzcG9uc2U7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRva2VuUmVzcG9uc2UgPSBhd2FpdCBjcmVkZW50aWFscy5nZXRUb2tlbih0b2tlblNjb3BlKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHRoaXMubG9naW5FcnJvciA9IG5ldyBBZ2dyZWdhdGVFcnJvcihcbiAgICAgICAgICAgICAgW25ldyBDb25uZWN0aW9uRXJyb3IoJ1NlY3VyaXR5IHRva2VuIGNvdWxkIG5vdCBiZSBhdXRoZW50aWNhdGVkIG9yIGF1dGhvcml6ZWQuJywgJ0VGRURBVVRIJyksIGVycl0pO1xuICAgICAgICAgICAgdGhpcy5lbWl0KCdjb25uZWN0JywgdGhpcy5sb2dpbkVycm9yKTtcbiAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvblRvKHRoaXMuU1RBVEUuRklOQUwpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuXG4gICAgICAgICAgY29uc3QgdG9rZW4gPSB0b2tlblJlc3BvbnNlLnRva2VuO1xuICAgICAgICAgIHRoaXMuc2VuZEZlZEF1dGhUb2tlbk1lc3NhZ2UodG9rZW4pO1xuXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5sb2dpbkVycm9yKSB7XG4gICAgICAgICAgaWYgKGlzVHJhbnNpZW50RXJyb3IodGhpcy5sb2dpbkVycm9yKSkge1xuICAgICAgICAgICAgdGhpcy5kZWJ1Zy5sb2coJ0luaXRpYXRpbmcgcmV0cnkgb24gdHJhbnNpZW50IGVycm9yJyk7XG4gICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25Ubyh0aGlzLlNUQVRFLlRSQU5TSUVOVF9GQUlMVVJFX1JFVFJZKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5lbWl0KCdjb25uZWN0JywgdGhpcy5sb2dpbkVycm9yKTtcbiAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvblRvKHRoaXMuU1RBVEUuRklOQUwpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmVtaXQoJ2Nvbm5lY3QnLCBuZXcgQ29ubmVjdGlvbkVycm9yKCdMb2dpbiBmYWlsZWQuJywgJ0VMT0dJTicpKTtcbiAgICAgICAgICB0aGlzLnRyYW5zaXRpb25Ubyh0aGlzLlNUQVRFLkZJTkFMKTtcbiAgICAgICAgfVxuXG4gICAgICB9KSgpLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgcHJvY2Vzcy5uZXh0VGljaygoKSA9PiB7XG4gICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZXZlbnRzOiB7XG4gICAgICBzb2NrZXRFcnJvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMudHJhbnNpdGlvblRvKHRoaXMuU1RBVEUuRklOQUwpO1xuICAgICAgfSxcbiAgICAgIGNvbm5lY3RUaW1lb3V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy50cmFuc2l0aW9uVG8odGhpcy5TVEFURS5GSU5BTCk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBMT0dHRURfSU5fU0VORElOR19JTklUSUFMX1NRTDoge1xuICAgIG5hbWU6ICdMb2dnZWRJblNlbmRpbmdJbml0aWFsU3FsJyxcbiAgICBlbnRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgICB0aGlzLnNlbmRJbml0aWFsU3FsKCk7XG4gICAgICAgIGxldCBtZXNzYWdlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIG1lc3NhZ2UgPSBhd2FpdCB0aGlzLm1lc3NhZ2VJby5yZWFkTWVzc2FnZSgpO1xuICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLnNvY2tldEVycm9yKGVycik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdG9rZW5TdHJlYW1QYXJzZXIgPSB0aGlzLmNyZWF0ZVRva2VuU3RyZWFtUGFyc2VyKG1lc3NhZ2UsIG5ldyBJbml0aWFsU3FsVG9rZW5IYW5kbGVyKHRoaXMpKTtcbiAgICAgICAgYXdhaXQgb25jZSh0b2tlblN0cmVhbVBhcnNlciwgJ2VuZCcpO1xuXG4gICAgICAgIHRoaXMudHJhbnNpdGlvblRvKHRoaXMuU1RBVEUuTE9HR0VEX0lOKTtcbiAgICAgICAgdGhpcy5wcm9jZXNzZWRJbml0aWFsU3FsKCk7XG5cbiAgICAgIH0pKCkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICBwcm9jZXNzLm5leHRUaWNrKCgpID0+IHtcbiAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBldmVudHM6IHtcbiAgICAgIHNvY2tldEVycm9yOiBmdW5jdGlvbiBzb2NrZXRFcnJvcigpIHtcbiAgICAgICAgdGhpcy50cmFuc2l0aW9uVG8odGhpcy5TVEFURS5GSU5BTCk7XG4gICAgICB9LFxuICAgICAgY29ubmVjdFRpbWVvdXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnRyYW5zaXRpb25Ubyh0aGlzLlNUQVRFLkZJTkFMKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIExPR0dFRF9JTjoge1xuICAgIG5hbWU6ICdMb2dnZWRJbicsXG4gICAgZXZlbnRzOiB7XG4gICAgICBzb2NrZXRFcnJvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMudHJhbnNpdGlvblRvKHRoaXMuU1RBVEUuRklOQUwpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgU0VOVF9DTElFTlRfUkVRVUVTVDoge1xuICAgIG5hbWU6ICdTZW50Q2xpZW50UmVxdWVzdCcsXG4gICAgZW50ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgKGFzeW5jICgpID0+IHtcbiAgICAgICAgbGV0IG1lc3NhZ2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgbWVzc2FnZSA9IGF3YWl0IHRoaXMubWVzc2FnZUlvLnJlYWRNZXNzYWdlKCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuc29ja2V0RXJyb3IoZXJyKTtcbiAgICAgICAgfVxuICAgICAgICAvLyByZXF1ZXN0IHRpbWVyIGlzIHN0b3BwZWQgb24gZmlyc3QgZGF0YSBwYWNrYWdlXG4gICAgICAgIHRoaXMuY2xlYXJSZXF1ZXN0VGltZXIoKTtcblxuICAgICAgICBjb25zdCB0b2tlblN0cmVhbVBhcnNlciA9IHRoaXMuY3JlYXRlVG9rZW5TdHJlYW1QYXJzZXIobWVzc2FnZSwgbmV3IFJlcXVlc3RUb2tlbkhhbmRsZXIodGhpcywgdGhpcy5yZXF1ZXN0ISkpO1xuXG4gICAgICAgIC8vIElmIHRoZSByZXF1ZXN0IHdhcyBjYW5jZWxlZCBhbmQgd2UgaGF2ZSBhIGBjYW5jZWxUaW1lcmBcbiAgICAgICAgLy8gZGVmaW5lZCwgd2Ugc2VuZCBhIGF0dGVudGlvbiBtZXNzYWdlIGFmdGVyIHRoZVxuICAgICAgICAvLyByZXF1ZXN0IG1lc3NhZ2Ugd2FzIGZ1bGx5IHNlbnQgb2ZmLlxuICAgICAgICAvL1xuICAgICAgICAvLyBXZSBhbHJlYWR5IHN0YXJ0ZWQgY29uc3VtaW5nIHRoZSBjdXJyZW50IG1lc3NhZ2VcbiAgICAgICAgLy8gKGJ1dCBhbGwgdGhlIHRva2VuIGhhbmRsZXJzIHNob3VsZCBiZSBuby1vcHMpLCBhbmRcbiAgICAgICAgLy8gbmVlZCB0byBlbnN1cmUgdGhlIG5leHQgbWVzc2FnZSBpcyBoYW5kbGVkIGJ5IHRoZVxuICAgICAgICAvLyBgU0VOVF9BVFRFTlRJT05gIHN0YXRlLlxuICAgICAgICBpZiAodGhpcy5yZXF1ZXN0Py5jYW5jZWxlZCAmJiB0aGlzLmNhbmNlbFRpbWVyKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMudHJhbnNpdGlvblRvKHRoaXMuU1RBVEUuU0VOVF9BVFRFTlRJT04pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgb25SZXN1bWUgPSAoKSA9PiB7XG4gICAgICAgICAgdG9rZW5TdHJlYW1QYXJzZXIucmVzdW1lKCk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IG9uUGF1c2UgPSAoKSA9PiB7XG4gICAgICAgICAgdG9rZW5TdHJlYW1QYXJzZXIucGF1c2UoKTtcblxuICAgICAgICAgIHRoaXMucmVxdWVzdD8ub25jZSgncmVzdW1lJywgb25SZXN1bWUpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMucmVxdWVzdD8ub24oJ3BhdXNlJywgb25QYXVzZSk7XG5cbiAgICAgICAgaWYgKHRoaXMucmVxdWVzdCBpbnN0YW5jZW9mIFJlcXVlc3QgJiYgdGhpcy5yZXF1ZXN0LnBhdXNlZCkge1xuICAgICAgICAgIG9uUGF1c2UoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG9uQ2FuY2VsID0gKCkgPT4ge1xuICAgICAgICAgIHRva2VuU3RyZWFtUGFyc2VyLnJlbW92ZUxpc3RlbmVyKCdlbmQnLCBvbkVuZE9mTWVzc2FnZSk7XG5cbiAgICAgICAgICBpZiAodGhpcy5yZXF1ZXN0IGluc3RhbmNlb2YgUmVxdWVzdCAmJiB0aGlzLnJlcXVlc3QucGF1c2VkKSB7XG4gICAgICAgICAgICAvLyByZXN1bWUgdGhlIHJlcXVlc3QgaWYgaXQgd2FzIHBhdXNlZCBzbyB3ZSBjYW4gcmVhZCB0aGUgcmVtYWluaW5nIHRva2Vuc1xuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0LnJlc3VtZSgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMucmVxdWVzdD8ucmVtb3ZlTGlzdGVuZXIoJ3BhdXNlJywgb25QYXVzZSk7XG4gICAgICAgICAgdGhpcy5yZXF1ZXN0Py5yZW1vdmVMaXN0ZW5lcigncmVzdW1lJywgb25SZXN1bWUpO1xuXG4gICAgICAgICAgLy8gVGhlIGBfY2FuY2VsQWZ0ZXJSZXF1ZXN0U2VudGAgY2FsbGJhY2sgd2lsbCBoYXZlIHNlbnQgYVxuICAgICAgICAgIC8vIGF0dGVudGlvbiBtZXNzYWdlLCBzbyBub3cgd2UgbmVlZCB0byBhbHNvIHN3aXRjaCB0b1xuICAgICAgICAgIC8vIHRoZSBgU0VOVF9BVFRFTlRJT05gIHN0YXRlIHRvIG1ha2Ugc3VyZSB0aGUgYXR0ZW50aW9uIGFja1xuICAgICAgICAgIC8vIG1lc3NhZ2UgaXMgcHJvY2Vzc2VkIGNvcnJlY3RseS5cbiAgICAgICAgICB0aGlzLnRyYW5zaXRpb25Ubyh0aGlzLlNUQVRFLlNFTlRfQVRURU5USU9OKTtcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBvbkVuZE9mTWVzc2FnZSA9ICgpID0+IHtcbiAgICAgICAgICB0aGlzLnJlcXVlc3Q/LnJlbW92ZUxpc3RlbmVyKCdjYW5jZWwnLCB0aGlzLl9jYW5jZWxBZnRlclJlcXVlc3RTZW50KTtcbiAgICAgICAgICB0aGlzLnJlcXVlc3Q/LnJlbW92ZUxpc3RlbmVyKCdjYW5jZWwnLCBvbkNhbmNlbCk7XG4gICAgICAgICAgdGhpcy5yZXF1ZXN0Py5yZW1vdmVMaXN0ZW5lcigncGF1c2UnLCBvblBhdXNlKTtcbiAgICAgICAgICB0aGlzLnJlcXVlc3Q/LnJlbW92ZUxpc3RlbmVyKCdyZXN1bWUnLCBvblJlc3VtZSk7XG5cbiAgICAgICAgICB0aGlzLnRyYW5zaXRpb25Ubyh0aGlzLlNUQVRFLkxPR0dFRF9JTik7XG4gICAgICAgICAgY29uc3Qgc3FsUmVxdWVzdCA9IHRoaXMucmVxdWVzdCBhcyBSZXF1ZXN0O1xuICAgICAgICAgIHRoaXMucmVxdWVzdCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBpZiAodGhpcy5jb25maWcub3B0aW9ucy50ZHNWZXJzaW9uIDwgJzdfMicgJiYgc3FsUmVxdWVzdC5lcnJvciAmJiB0aGlzLmlzU3FsQmF0Y2gpIHtcbiAgICAgICAgICAgIHRoaXMuaW5UcmFuc2FjdGlvbiA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzcWxSZXF1ZXN0LmNhbGxiYWNrKHNxbFJlcXVlc3QuZXJyb3IsIHNxbFJlcXVlc3Qucm93Q291bnQsIHNxbFJlcXVlc3Qucm93cyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdG9rZW5TdHJlYW1QYXJzZXIub25jZSgnZW5kJywgb25FbmRPZk1lc3NhZ2UpO1xuICAgICAgICB0aGlzLnJlcXVlc3Q/Lm9uY2UoJ2NhbmNlbCcsIG9uQ2FuY2VsKTtcbiAgICAgIH0pKCk7XG5cbiAgICB9LFxuICAgIGV4aXQ6IGZ1bmN0aW9uKG5leHRTdGF0ZSkge1xuICAgICAgdGhpcy5jbGVhclJlcXVlc3RUaW1lcigpO1xuICAgIH0sXG4gICAgZXZlbnRzOiB7XG4gICAgICBzb2NrZXRFcnJvcjogZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIGNvbnN0IHNxbFJlcXVlc3QgPSB0aGlzLnJlcXVlc3QhO1xuICAgICAgICB0aGlzLnJlcXVlc3QgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMudHJhbnNpdGlvblRvKHRoaXMuU1RBVEUuRklOQUwpO1xuXG4gICAgICAgIHNxbFJlcXVlc3QuY2FsbGJhY2soZXJyKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIFNFTlRfQVRURU5USU9OOiB7XG4gICAgbmFtZTogJ1NlbnRBdHRlbnRpb24nLFxuICAgIGVudGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIChhc3luYyAoKSA9PiB7XG4gICAgICAgIGxldCBtZXNzYWdlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIG1lc3NhZ2UgPSBhd2FpdCB0aGlzLm1lc3NhZ2VJby5yZWFkTWVzc2FnZSgpO1xuICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLnNvY2tldEVycm9yKGVycik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBoYW5kbGVyID0gbmV3IEF0dGVudGlvblRva2VuSGFuZGxlcih0aGlzLCB0aGlzLnJlcXVlc3QhKTtcbiAgICAgICAgY29uc3QgdG9rZW5TdHJlYW1QYXJzZXIgPSB0aGlzLmNyZWF0ZVRva2VuU3RyZWFtUGFyc2VyKG1lc3NhZ2UsIGhhbmRsZXIpO1xuXG4gICAgICAgIGF3YWl0IG9uY2UodG9rZW5TdHJlYW1QYXJzZXIsICdlbmQnKTtcbiAgICAgICAgLy8gMy4yLjUuNyBTZW50IEF0dGVudGlvbiBTdGF0ZVxuICAgICAgICAvLyBEaXNjYXJkIGFueSBkYXRhIGNvbnRhaW5lZCBpbiB0aGUgcmVzcG9uc2UsIHVudGlsIHdlIHJlY2VpdmUgdGhlIGF0dGVudGlvbiByZXNwb25zZVxuICAgICAgICBpZiAoaGFuZGxlci5hdHRlbnRpb25SZWNlaXZlZCkge1xuICAgICAgICAgIHRoaXMuY2xlYXJDYW5jZWxUaW1lcigpO1xuXG4gICAgICAgICAgY29uc3Qgc3FsUmVxdWVzdCA9IHRoaXMucmVxdWVzdCE7XG4gICAgICAgICAgdGhpcy5yZXF1ZXN0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgIHRoaXMudHJhbnNpdGlvblRvKHRoaXMuU1RBVEUuTE9HR0VEX0lOKTtcblxuICAgICAgICAgIGlmIChzcWxSZXF1ZXN0LmVycm9yICYmIHNxbFJlcXVlc3QuZXJyb3IgaW5zdGFuY2VvZiBSZXF1ZXN0RXJyb3IgJiYgc3FsUmVxdWVzdC5lcnJvci5jb2RlID09PSAnRVRJTUVPVVQnKSB7XG4gICAgICAgICAgICBzcWxSZXF1ZXN0LmNhbGxiYWNrKHNxbFJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzcWxSZXF1ZXN0LmNhbGxiYWNrKG5ldyBSZXF1ZXN0RXJyb3IoJ0NhbmNlbGVkLicsICdFQ0FOQ0VMJykpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICB9KSgpLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgcHJvY2Vzcy5uZXh0VGljaygoKSA9PiB7XG4gICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZXZlbnRzOiB7XG4gICAgICBzb2NrZXRFcnJvcjogZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIGNvbnN0IHNxbFJlcXVlc3QgPSB0aGlzLnJlcXVlc3QhO1xuICAgICAgICB0aGlzLnJlcXVlc3QgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgdGhpcy50cmFuc2l0aW9uVG8odGhpcy5TVEFURS5GSU5BTCk7XG5cbiAgICAgICAgc3FsUmVxdWVzdC5jYWxsYmFjayhlcnIpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgRklOQUw6IHtcbiAgICBuYW1lOiAnRmluYWwnLFxuICAgIGVudGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuY2xlYW51cENvbm5lY3Rpb24oQ0xFQU5VUF9UWVBFLk5PUk1BTCk7XG4gICAgfSxcbiAgICBldmVudHM6IHtcbiAgICAgIGNvbm5lY3RUaW1lb3V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gRG8gbm90aGluZywgYXMgdGhlIHRpbWVyIHNob3VsZCBiZSBjbGVhbmVkIHVwLlxuICAgICAgfSxcbiAgICAgIG1lc3NhZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBEbyBub3RoaW5nXG4gICAgICB9LFxuICAgICAgc29ja2V0RXJyb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBEbyBub3RoaW5nXG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxJQUFBQSxPQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxHQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxHQUFBLEdBQUFDLHVCQUFBLENBQUFILE9BQUE7QUFDQSxJQUFBSSxHQUFBLEdBQUFELHVCQUFBLENBQUFILE9BQUE7QUFDQSxJQUFBSyxJQUFBLEdBQUFOLHNCQUFBLENBQUFDLE9BQUE7QUFFQSxJQUFBTSxVQUFBLEdBQUFQLHNCQUFBLENBQUFDLE9BQUE7QUFHQSxJQUFBTyxPQUFBLEdBQUFQLE9BQUE7QUFFQSxJQUFBUSxTQUFBLEdBQUFSLE9BQUE7QUFPQSxJ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