'use strict'
import { NightwatchBrowser } from 'nightwatch'
import init from '../helpers/init'
import sauce from './sauce'

module.exports = {
  before: function (browser: NightwatchBrowser, done: VoidFunction) {
    init(browser, done, 'http://127.0.0.1:8080?plugins=solidity,udapp', false)
  },

  'Should execution a simple console command': function (browser: NightwatchBrowser) {
    browser
      .waitForElementVisible('*[data-id="terminalCli"]', 10000)
      .executeScript('console.log(1 + 1)')
      .journalLastChild('2')
  },

  'Should clear console': function (browser: NightwatchBrowser) {
    browser
      .waitForElementVisible('*[data-id="terminalCli"]')
      .journalChildIncludes('Welcome to Remix')
      .click('#clearConsole')
      .assert.containsText('*[data-id="terminalJournal"]', '')
  },

  'Should display auto-complete menu': function (browser: NightwatchBrowser) {
    browser
      .waitForElementVisible('*[data-id="terminalCli"]')
      .click('*[data-id="terminalCli"]')
      .sendKeys('*[data-id="terminalCliInput"]', 'remix.')
      .assert.visible('*[data-id="autoCompletePopUpAutoCompleteItem"]')
  },

  'Should execute remix.help() command': function (browser: NightwatchBrowser) {
    browser
      .waitForElementVisible('*[data-id="terminalCli"]')
      .executeScript('remix.help()')
      .journalChildIncludes('remix.loadgist(id)')
      .journalChildIncludes('remix.loadurl(url)')
      .journalChildIncludes('remix.execute(filepath)')
      .journalChildIncludes('remix.exeCurrent()')
      .journalChildIncludes('remix.help()')
  },

  'Async/Await Script': function (browser: NightwatchBrowser) {
    browser
      .addFile('asyncAwait.js', { content: asyncAwait })
      .openFile('asyncAwait.js')
      .executeScript('remix.execute(\'asyncAwait.js\')')
      .journalLastChild('Waiting Promise')
      .pause(5500)
      .journalLastChild('result - Promise Resolved')
  },

  'Call Remix File Manager from a script': function (browser: NightwatchBrowser) {
    browser
      .addFile('asyncAwaitWithFileManagerAccess.js', { content: asyncAwaitWithFileManagerAccess })
      .openFile('asyncAwaitWithFileManagerAccess.js')
      .pause(5000)
      .executeScript('remix.execute(\'asyncAwaitWithFileManagerAccess.js\')')
      .pause(6000)
      .journalLastChildIncludes('contract Ballot {')
  },

  'Call web3.eth.getAccounts() using JavaScript VM': function (browser: NightwatchBrowser) {
    browser
      .executeScript('web3.eth.getAccounts()')
      .pause(2000)
      .journalLastChildIncludes('"0xCA35b7d915458EF540aDe6068dFe2F44E8fa733c", "0x14723A09ACff6D2A60DcdF7aA4AFf308FDDC160C", "0x4B0897b0513fdC7C541B6d9D7E929C4e5364D2dB", "0x583031D1113aD414F02576BD6afaBfb302140225", "0xdD870fA1b7C4700F2BD7f44238821C26f7392148"')
  },

  'Call web3.eth.getAccounts() using Web3 Provider': function (browser: NightwatchBrowser) {
    browser
      .click('*[data-id="terminalClearConsole"]') // clear the terminal
      .clickLaunchIcon('udapp')
      .click('*[data-id="settingsWeb3Mode"]')
      .modalFooterOKClick()
      .executeScript('web3.eth.getAccounts()')
      .pause(2000)
      .journalLastChildIncludes('[ "') // we check if an array is present, don't need to check for the content
      .journalLastChildIncludes('" ]')
      .journalLastChildIncludes('", "')
  },

  'Call Remix File Resolver (external URL) from a script': function (browser: NightwatchBrowser) {
    browser
      .click('*[data-id="terminalClearConsole"]') // clear the terminal
      .addFile('resolveExternalUrlAndSave.js', { content: resolveExternalUrlAndSave })
      .openFile('resolveExternalUrlAndSave.js')
      .pause(1000)
      .executeScript('remix.execute(\'resolveExternalUrlAndSave.js\')')
      .pause(6000)
      .journalLastChildIncludes('Implementation of the {IERC20} interface.')
      .openFile('.deps/github/OpenZeppelin/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol')
  },

  'Call Remix File Resolver (internal URL) from a script': function (browser: NightwatchBrowser) {
    browser
      .click('*[data-id="terminalClearConsole"]') // clear the terminal
      .addFile('resolveUrl.js', { content: resolveUrl })
      .openFile('resolveUrl.js')
      .pause(1000)
      .executeScript('remix.execute(\'resolveUrl.js\')')
      .pause(6000)
      .journalLastChildIncludes('contract Ballot {')
  },

  'Call Remix File Resolver (internal URL) from a script and specify a path': function (browser: NightwatchBrowser) {
    browser
      .click('*[data-id="terminalClearConsole"]') // clear the terminal
      .addFile('resolveExternalUrlAndSaveToaPath.js', { content: resolveExternalUrlAndSaveToaPath })
      .openFile('resolveExternalUrlAndSaveToaPath.js')
      .pause(1000)
      .executeScript('remix.execute(\'resolveExternalUrlAndSaveToaPath.js\')')
      .pause(6000)
      .journalLastChildIncludes('abstract contract ERC20Burnable')
      .openFile('.deps/github/newFile.sol')
      .end()
  },

  tearDown: sauce
}

const asyncAwait = `
  var p = function () {
    return new Promise(function (resolve, reject)  {
        setTimeout(function ()  {
            resolve("Promise Resolved")
        }, 5000)
    })
  } 

  var run = async () => {
    console.log('Waiting Promise')
    var result = await p()
    console.log('result - ', result)
  }

  run()
`

const asyncAwaitWithFileManagerAccess = `
  var p = function () {
    return new Promise(function (resolve, reject)  {
        setTimeout(function ()  {
            resolve("Promise Resolved")
        }, 0)
    })
  }

  var run = async () => {
    console.log('Waiting Promise')
    var result = await p()
    let text = await remix.call('fileManager', 'readFile', 'contracts/3_Ballot.sol')
    console.log('result - ', text)
  }

  run()
`

const resolveExternalUrlAndSave = `
(async () => {
  try {
      console.log('start')
      console.log(await remix.call('contentImport', 'resolveAndSave', 'https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol'))
  } catch (e) {
      console.log(e.message)
  }
})()  
`

const resolveExternalUrlAndSaveToaPath = `
(async () => {
  try {
      console.log('start')
      console.log(await remix.call('contentImport', 'resolveAndSave', 'https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/extensions/ERC20Burnable.sol', 'github/newFile.sol'))
  } catch (e) {
      console.log(e.message)
  }
})()  
`

const resolveUrl = `
(async () => {
  try {
      console.log('start')
      console.log(await remix.call('contentImport', 'resolveAndSave', 'contracts/3_Ballot.sol'))
  } catch (e) {
      console.log(e.message)
  }
})()  
`
