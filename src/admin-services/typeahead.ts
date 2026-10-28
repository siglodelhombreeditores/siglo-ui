/**
 * basedon admin-dev/themes/new-theme/js/product-page/product-search-autocomplete.js
 */
import $ from 'jquery';

// based on admin-dev/themes/new-theme/js/components/auto-complete-search.ts
interface TypeaheadJQueryOptions extends Twitter.Typeahead.Options {
  limit: number,
  minLength: number,
  highlight: boolean,
  hint: boolean,
  cache:boolean,
  onSelect: (
    selectedItem: any,
    event: JQueryEventObject,
    searchInput: JQuery
  ) => boolean;
  onClose: (event: JQueryEventObject, searchInput: JQuery) => void;
}

export const typeahead = {
  load() {
    bindDeleteClickToDocument();
    $('.siglo-typeahead-model-collection').each(function () {
      loadTypeahead($(this));
    });
  }
}

function loadTypeahead($autocompleteObject: any) {
  const autocompleteFormId = $autocompleteObject.data('formid');
  const autocompleteFormLimit = parseInt($autocompleteObject.data('limit'));
  const mappingvalue = $autocompleteObject.data('mappingvalue') as string;
  const mappingname = $autocompleteObject.data('mappingname') as string;
  const fullname = $autocompleteObject.data('fullname') as string;
  const remoteurl = $autocompleteObject.data('remoteurl') as string;
  const sortable = !!$autocompleteObject.data('sortable');
  const $autocompleteData = $('#' + autocompleteFormId + '-data');

  const Bloodhound = (window as any).Bloodhound;
  const bloodHound = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.whitespace,
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    identify: function(obj: any) {
      return obj[mappingvalue];
    },
    remote: {
      url: remoteurl,
      cache: false,
      wildcard: '__QUERY__',
      transform: (response: any) => !response ? [] : response
    }
  });

  //define typeahead
  $('#' + autocompleteFormId).typeahead(<TypeaheadJQueryOptions>{
    limit: 150,
    minLength: 1,
    highlight: true,
    cache: false,
    hint: false
  }, {
    display: mappingname,
    source: bloodHound,
    limit: 30,
    templates: {
      notFound: () => '<div>Sin resultados</div>',
      pending: () => '<div>Buscando...</div>',
      suggestion: (item: any) => '<div>' + item.name + '</div>'
    },
  }).on('typeahead:select', function(e, suggestion) {
    //if collection length is up to limit, return

    let formIdItem = $(`#${autocompleteFormId}-data li`);

    if (autocompleteFormLimit !== 0 && formIdItem.length >= autocompleteFormLimit) {
      return false;
    }

    let value = suggestion[mappingvalue];
    if (suggestion.id_product_attribute) {
      value = value + ',' + suggestion.id_product_attribute;
    }

    let tplcollection = $('#tplcollection-' + autocompleteFormId);
    let tplcollectionHtml = tplcollection.html().replace('%s', suggestion[mappingname]);

    const html = '<li class="media">'
      + (sortable ? '<span class="drag-handle"></span>' : '')
      + '<div class="media-body media-middle">'
      + tplcollectionHtml
      + '</div>'
      + `<input type="hidden" name="${fullname}[data][]" value="${value}" />`
      + '</li>';

    $autocompleteData.append(html);
  })
    .on('typeahead:close', e => $(e.target).val(''))
    .on('focusout', e => $(e.target).typeahead('val', ''));

  if (sortable) {
    ($autocompleteData as any).sortable({
      opacity: 0.6,
      cursor: "move",
      handle: ".drag-handle",
      update: function() {
        window.prestashop.component.EventEmitter.emit('updateSubmitButtonState');
      }
    });
  }

}

function bindDeleteClickToDocument() {
  $(document).on('click', '.siglo-typeahead-list .delete', function (e) {
    e.preventDefault();
    window.modalConfirmation.create('¿Estás seguro de quieres eliminar esto?', null, {
      onContinue: () => e.target.closest('.media')?.remove()
    }).show();
  });
}