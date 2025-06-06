/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/*
 * React component for viewing and editing a filter list, a list of items
 * used for example to safe list items via a job detector rule.
 */

import PropTypes from 'prop-types';
import React, { Component } from 'react';

import {
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSearchBar,
  EuiSpacer,
} from '@elastic/eui';

import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';

import { withKibana } from '@kbn/kibana-react-plugin/public';
import { EditFilterListHeader } from './header';
import { EditFilterListToolbar } from './toolbar';
import { ItemsGrid } from '../../../components/items_grid';
import { isValidFilterListId, saveFilterList } from './utils';
import { toastNotificationServiceProvider } from '../../../services/toast_notification_service';
import { ML_PAGES } from '../../../../../common/constants/locator';
import { HelpMenu } from '../../../components/help_menu';

const DEFAULT_ITEMS_PER_PAGE = 50;

// Returns the list of items that match the query entered in the EuiSearchBar.
function getMatchingFilterItems(searchBarQuery, items) {
  if (items === undefined) {
    return [];
  }

  if (searchBarQuery === undefined) {
    return [...items];
  }

  // Convert the list of Strings into a list of Objects suitable for running through
  // the search bar query.
  const allItems = items.map((item) => ({ value: item }));
  const matchingObjects = EuiSearchBar.Query.execute(searchBarQuery, allItems, {
    defaultFields: ['value'],
  });
  return matchingObjects.map((item) => item.value);
}

function getActivePage(activePageState, itemsPerPage, numMatchingItems) {
  // Checks if supplied active page number from state is applicable for the number
  // of matching items in the grid, and if not returns the last applicable page number.
  let activePage = activePageState;
  const activePageStartIndex = itemsPerPage * activePageState;
  if (activePageStartIndex > numMatchingItems) {
    activePage = Math.max(Math.ceil(numMatchingItems / itemsPerPage) - 1, 0); // Sets to 0 for 0 matches.
  }
  return activePage;
}

export class EditFilterListUI extends Component {
  static displayName = 'EditFilterList';
  static propTypes = {
    filterId: PropTypes.string,
    canCreateFilter: PropTypes.bool.isRequired,
    canDeleteFilter: PropTypes.bool.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      description: '',
      items: [],
      matchingItems: [],
      selectedItems: [],
      loadedFilter: {},
      newFilterId: '',
      isNewFilterIdInvalid: true,
      activePage: 0,
      itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
      saveInProgress: false,
    };
  }

  componentDidMount() {
    this.toastNotificationService = toastNotificationServiceProvider(
      this.props.kibana.services.notifications.toasts
    );
    const filterId = this.props.filterId;
    if (filterId !== undefined) {
      this.loadFilterList(filterId);
    } else {
      this.setState({ newFilterId: '' });
    }
  }

  returnToFiltersList = async () => {
    const {
      services: {
        http: { basePath },
        application: { navigateToUrl },
      },
    } = this.props.kibana;
    await navigateToUrl(
      `${basePath.get()}/app/management/ml/ad_settings/${ML_PAGES.FILTER_LISTS_MANAGE}`,
      true
    );
  };

  loadFilterList = (filterId) => {
    const mlApi = this.props.kibana.services.mlServices.mlApi;
    mlApi.filters
      .filters({ filterId })
      .then((filter) => {
        this.setLoadedFilterState(filter);
      })
      .catch((error) => {
        this.toastNotificationService.displayErrorToast(
          error,
          i18n.translate(
            'xpack.ml.settings.filterLists.editFilterList.loadingDetailsOfFilterErrorMessage',
            {
              defaultMessage: 'An error occurred loading details of filter {filterId}',
              values: {
                filterId,
              },
            }
          )
        );
      });
  };

  setLoadedFilterState = (loadedFilter) => {
    // Store the loaded filter so we can diff changes to the items when saving updates.
    this.setState((prevState) => {
      const { itemsPerPage, searchQuery } = prevState;

      const matchingItems = getMatchingFilterItems(searchQuery, loadedFilter.items);
      const activePage = getActivePage(prevState.activePage, itemsPerPage, matchingItems.length);

      return {
        description: loadedFilter.description,
        items: loadedFilter.items !== undefined ? [...loadedFilter.items] : [],
        matchingItems,
        selectedItems: [],
        loadedFilter,
        isNewFilterIdInvalid: false,
        activePage,
        searchQuery,
        saveInProgress: false,
      };
    });
  };

  updateNewFilterId = (newFilterId) => {
    this.setState({
      newFilterId,
      isNewFilterIdInvalid: !isValidFilterListId(newFilterId),
    });
  };

  updateDescription = (description) => {
    this.setState({ description });
  };

  addItems = (itemsToAdd) => {
    this.setState((prevState) => {
      const { itemsPerPage, searchQuery } = prevState;
      const items = [...prevState.items];
      const alreadyInFilter = [];
      itemsToAdd.forEach((item) => {
        if (items.indexOf(item) === -1) {
          items.push(item);
        } else {
          alreadyInFilter.push(item);
        }
      });
      items.sort((str1, str2) => {
        return str1.localeCompare(str2);
      });

      if (alreadyInFilter.length > 0) {
        const { toasts } = this.props.kibana.services.notifications;
        toasts.addWarning(
          i18n.translate(
            'xpack.ml.settings.filterLists.editFilterList.duplicatedItemsInFilterListWarningMessage',
            {
              defaultMessage:
                'The following items were already in the filter list: {alreadyInFilter}',
              values: {
                alreadyInFilter,
              },
            }
          )
        );
      }

      const matchingItems = getMatchingFilterItems(searchQuery, items);
      const activePage = getActivePage(prevState.activePage, itemsPerPage, matchingItems.length);

      return {
        items,
        matchingItems,
        activePage,
        searchQuery,
      };
    });
  };

  deleteSelectedItems = () => {
    this.setState((prevState) => {
      const { selectedItems, itemsPerPage, searchQuery } = prevState;
      const items = [...prevState.items];
      selectedItems.forEach((item) => {
        const index = items.indexOf(item);
        if (index !== -1) {
          items.splice(index, 1);
        }
      });

      const matchingItems = getMatchingFilterItems(searchQuery, items);
      const activePage = getActivePage(prevState.activePage, itemsPerPage, matchingItems.length);

      return {
        items,
        matchingItems,
        selectedItems: [],
        activePage,
        searchQuery,
      };
    });
  };

  onSearchChange = ({ query }) => {
    this.setState((prevState) => {
      const { items, itemsPerPage } = prevState;

      const matchingItems = getMatchingFilterItems(query, items);
      const activePage = getActivePage(prevState.activePage, itemsPerPage, matchingItems.length);

      return {
        matchingItems,
        activePage,
        searchQuery: query,
      };
    });
  };

  setItemSelected = (item, isSelected) => {
    this.setState((prevState) => {
      const selectedItems = [...prevState.selectedItems];
      const index = selectedItems.indexOf(item);
      if (isSelected === true && index === -1) {
        selectedItems.push(item);
      } else if (isSelected === false && index !== -1) {
        selectedItems.splice(index, 1);
      }

      return {
        selectedItems,
      };
    });
  };

  setActivePage = (activePage) => {
    this.setState({ activePage });
  };

  setItemsPerPage = (itemsPerPage) => {
    this.setState({
      itemsPerPage,
      activePage: 0,
    });
  };

  save = () => {
    this.setState({ saveInProgress: true });

    const { loadedFilter, newFilterId, description, items } = this.state;
    const filterId = this.props.filterId !== undefined ? this.props.filterId : newFilterId;
    saveFilterList(
      this.props.kibana.services.notifications.toasts,
      this.props.kibana.services.mlServices.mlApi,
      filterId,
      description,
      items,
      loadedFilter
    )
      .then((savedFilter) => {
        this.setLoadedFilterState(savedFilter);
        this.returnToFiltersList();
      })
      .catch((error) => {
        this.toastNotificationService.displayErrorToast(
          error,
          i18n.translate('xpack.ml.settings.filterLists.editFilterList.savingFilterErrorMessage', {
            defaultMessage: 'An error occurred saving filter {filterId}',
            values: {
              filterId,
            },
          })
        );
        this.setState({ saveInProgress: false });
      });
  };

  render() {
    const {
      loadedFilter,
      newFilterId,
      isNewFilterIdInvalid,
      description,
      items,
      matchingItems,
      selectedItems,
      itemsPerPage,
      activePage,
      saveInProgress,
    } = this.state;
    const { canCreateFilter, canDeleteFilter } = this.props;

    const totalItemCount = items !== undefined ? items.length : 0;

    const helpLink = this.props.kibana.services.docLinks.links.ml.customRules;

    return (
      <>
        <div data-test-subj="mlPageFilterListEdit">
          {/*<EuiPageContent verticalPosition="center" horizontalPosition="center">*/}
          <EditFilterListHeader
            canCreateFilter={canCreateFilter}
            filterId={this.props.filterId}
            newFilterId={newFilterId}
            isNewFilterIdInvalid={isNewFilterIdInvalid}
            updateNewFilterId={this.updateNewFilterId}
            description={description}
            updateDescription={this.updateDescription}
            totalItemCount={totalItemCount}
            usedBy={loadedFilter.used_by}
          />
          <EditFilterListToolbar
            canCreateFilter={canCreateFilter}
            canDeleteFilter={canDeleteFilter}
            onSearchChange={this.onSearchChange}
            addItems={this.addItems}
            deleteSelectedItems={this.deleteSelectedItems}
            selectedItemCount={selectedItems.length}
          />
          <EuiSpacer size="xl" />
          <ItemsGrid
            totalItemCount={totalItemCount}
            items={matchingItems}
            selectedItems={selectedItems}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={this.setItemsPerPage}
            setItemSelected={this.setItemSelected}
            activePage={activePage}
            setActivePage={this.setActivePage}
          />
          <EuiFlexGroup justifyContent="flexEnd">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                data-test-subj={'mlFilterListCancelButton'}
                onClick={() => this.returnToFiltersList()}
              >
                <FormattedMessage
                  id="xpack.ml.settings.filterLists.editFilterList.cancelButtonLabel"
                  defaultMessage="Cancel"
                />
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                onClick={this.save}
                disabled={
                  saveInProgress === true ||
                  isNewFilterIdInvalid === true ||
                  canCreateFilter === false
                }
                fill
                data-test-subj={'mlFilterListSaveButton'}
              >
                <FormattedMessage
                  id="xpack.ml.settings.filterLists.editFilterList.saveButtonLabel"
                  defaultMessage="Save"
                />
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
          {/*</EuiPageContent>*/}
        </div>
        <HelpMenu docLink={helpLink} />
      </>
    );
  }
}
export const EditFilterList = withKibana(EditFilterListUI);
