/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import expect from '@kbn/expect';
import { FtrProviderContext } from '../ftr_provider_context';

export default function ({ getService, getPageObjects }: FtrProviderContext) {
  const browser = getService('browser');
  const dataGrid = getService('dataGrid');
  const dashboardAddPanel = getService('dashboardAddPanel');
  const filterBar = getService('filterBar');
  const queryBar = getService('queryBar');
  const esArchiver = getService('esArchiver');
  const kibanaServer = getService('kibanaServer');
  const testSubjects = getService('testSubjects');
  const find = getService('find');
  const retry = getService('retry');
  const { common, dashboard, header, discover } = getPageObjects([
    'common',
    'dashboard',
    'header',
    'discover',
  ]);

  describe('discover saved search embeddable', () => {
    before(async () => {
      await esArchiver.loadIfNeeded(
        'src/platform/test/functional/fixtures/es_archiver/logstash_functional'
      );
      await esArchiver.loadIfNeeded(
        'src/platform/test/functional/fixtures/es_archiver/dashboard/current/data'
      );
      await kibanaServer.savedObjects.cleanStandardList();
      await kibanaServer.importExport.load(
        'src/platform/test/functional/fixtures/kbn_archiver/dashboard/current/kibana'
      );
      await kibanaServer.uiSettings.replace({
        defaultIndex: '0bf35f60-3dc9-11e8-8660-4d65aa086b3c',
      });
      await common.setTime({
        from: 'Sep 22, 2015 @ 00:00:00.000',
        to: 'Sep 23, 2015 @ 00:00:00.000',
      });
    });

    after(async () => {
      await kibanaServer.savedObjects.cleanStandardList();
      await common.unsetTime();
    });

    beforeEach(async () => {
      await dashboard.navigateToApp();
      await filterBar.ensureFieldEditorModalIsClosed();
      await dashboard.gotoDashboardLandingPage();
      await dashboard.clickNewDashboard();
    });

    const addSearchEmbeddableToDashboard = async () => {
      await dashboardAddPanel.addSavedSearch('Rendering-Test:-saved-search');
      await header.waitUntilLoadingHasFinished();
      await dashboard.waitForRenderComplete();
      const rows = await dataGrid.getDocTableRows();
      expect(rows.length).to.be.above(0);
    };

    const refreshDashboardPage = async () => {
      await browser.refresh();
      await header.waitUntilLoadingHasFinished();
      await dashboard.waitForRenderComplete();
    };

    it('can save a search embeddable with a defined rows per page number', async function () {
      const dashboardName = 'Dashboard with a Paginated Saved Search';
      await addSearchEmbeddableToDashboard();
      await dataGrid.checkCurrentRowsPerPageToBe(100);

      await dashboard.saveDashboard(dashboardName, {
        saveAsNew: true,
        waitDialogIsClosed: true,
        exitFromEditMode: false,
      });

      await refreshDashboardPage();

      await dataGrid.checkCurrentRowsPerPageToBe(100);

      await dataGrid.changeRowsPerPageTo(10);

      await dashboard.saveDashboard(dashboardName, { saveAsNew: false });
      await refreshDashboardPage();

      await dataGrid.checkCurrentRowsPerPageToBe(10);
    });

    it('should control columns correctly', async () => {
      await addSearchEmbeddableToDashboard();
      await dashboard.switchToEditMode();

      const cell = await dataGrid.getCellElementExcludingControlColumns(0, 0);
      expect(await cell.getVisibleText()).to.be('Sep 22, 2015 @ 23:50:13.253');
      await dataGrid.clickMoveColumnLeft('agent');

      const cellAfter = await dataGrid.getCellElementExcludingControlColumns(0, 0);
      expect(await cellAfter.getVisibleText()).to.be(
        'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.1.4322)'
      );

      await dataGrid.clickRemoveColumn('agent');
      expect(await cell.getVisibleText()).to.be('Sep 22, 2015 @ 23:50:13.253');
    });

    it('should render duplicate saved search embeddables', async () => {
      await addSearchEmbeddableToDashboard();
      await addSearchEmbeddableToDashboard();
      const [firstGridCell, secondGridCell] = await dataGrid.getAllCellElements();
      const firstGridCellContent = await firstGridCell.getVisibleText();
      const secondGridCellContent = await secondGridCell.getVisibleText();

      expect(firstGridCellContent).to.be.equal(secondGridCellContent);
    });

    it('should display an error', async () => {
      await addSearchEmbeddableToDashboard();
      await queryBar.setQuery('bytes > 5000');
      await queryBar.submitQuery();
      await header.waitUntilLoadingHasFinished();
      expect(await discover.getSavedSearchDocumentCount()).to.be('2,572 documents');
      await queryBar.setQuery('this < is not : a valid > query');
      await queryBar.submitQuery();
      await header.waitUntilLoadingHasFinished();
      const embeddableError = await testSubjects.find('embeddableError');
      const errorMessage = await embeddableError.findByTestSubject('errorMessageMarkdown');
      const errorText = await errorMessage.getVisibleText();
      expect(errorText).to.match(/Expected[\S\s]+but "n" found/);
    });

    it('should not show the full screen button', async () => {
      await addSearchEmbeddableToDashboard();
      await testSubjects.missingOrFail('dataGridFullScreenButton');
    });

    it('should show the the grid toolbar', async () => {
      await addSearchEmbeddableToDashboard();
      await testSubjects.existOrFail('unifiedDataTableToolbar');
    });

    it('should display search highlights', async () => {
      await addSearchEmbeddableToDashboard();
      await queryBar.setQuery('Mozilla');
      await queryBar.submitQuery();
      await header.waitUntilLoadingHasFinished();
      await dashboard.waitForRenderComplete();
      const marks = await find.allByCssSelector('.unifiedDataTable__cellValue mark');
      const highlights = await Promise.all(
        marks.map(async (highlight) => await highlight.getVisibleText())
      );
      expect(highlights.length).to.be.greaterThan(0);
      expect(highlights.every((text) => text === 'Mozilla')).to.be(true);
    });

    it('should expand the detail row when the toggle arrow is clicked', async function () {
      await addSearchEmbeddableToDashboard();
      await retry.try(async function () {
        await dataGrid.clickRowToggle({ isAnchorRow: false, rowIndex: 0 });
        const detailsEl = await dataGrid.getDetailsRows();
        const defaultMessageEl = await detailsEl[0].findByTestSubject('docViewerRowDetailsTitle');
        expect(defaultMessageEl).to.be.ok();
        await dataGrid.closeFlyout();
      });
    });

    it('filters are added when a cell filter is clicked', async function () {
      await addSearchEmbeddableToDashboard();
      const gridCell = '[role="gridcell"]:nth-child(4)';
      const filterOutButton = '[data-test-subj="filterOutButton"]';
      const filterForButton = '[data-test-subj="filterForButton"]';
      await retry.try(async () => {
        await find.clickByCssSelector(gridCell);
        await find.clickByCssSelector(filterOutButton);
        await header.waitUntilLoadingHasFinished();
        const filterCount = await filterBar.getFilterCount();
        expect(filterCount).to.equal(1);
      });
      await header.waitUntilLoadingHasFinished();
      await retry.try(async () => {
        await find.clickByCssSelector(gridCell);
        await find.clickByCssSelector(filterForButton);
        await header.waitUntilLoadingHasFinished();
        const filterCount = await filterBar.getFilterCount();
        expect(filterCount).to.equal(2);
      });
    });
  });
}
