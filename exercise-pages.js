(function () {
  var saveStatus = document.querySelector("[data-save-status]");

  function setStatus(message) {
    if (!saveStatus) {
      return;
    }
    saveStatus.textContent = message;
  }

  function getStoredValue(key) {
    try {
      return window.localStorage.getItem(key) || "";
    } catch (error) {
      return "";
    }
  }

  function setStoredValue(key, value) {
    try {
      window.localStorage.setItem(key, value);
      setStatus("Votre travail est enregistre localement sur ce navigateur.");
    } catch (error) {
      setStatus("Le navigateur bloque l'enregistrement local. Pensez a copier votre travail.");
    }
  }

  function updateReadOnlyFields(key, value) {
    document.querySelectorAll('[data-read-from="' + key + '"]').forEach(function (element) {
      element.value = value || element.dataset.emptyMessage || "";
    });
  }

  function getTemplateBindings(element) {
    if (element.dataset.templateBindings) {
      return element.dataset.templateBindings.split("||").map(function (entry) {
        var parts = entry.split("::");
        return {
          key: (parts[0] || "").trim(),
          token: (parts[1] || "").trim()
        };
      }).filter(function (binding) {
        return binding.key;
      });
    }

    if (element.dataset.templateSourceKey) {
      return [{
        key: element.dataset.templateSourceKey,
        token: element.dataset.templateToken || ""
      }];
    }

    return [];
  }

  function renderTemplateField(element) {
    var template = element.dataset.templateValue || element.value || "";
    var output = template;
    var bindings = getTemplateBindings(element);

    if (!element.dataset.templateValue) {
      element.dataset.templateValue = template;
    }

    bindings.forEach(function (binding) {
      var replacement = getStoredValue(binding.key).trim() || element.dataset.templateEmptyMessage || "";
      output = binding.token ? output.split(binding.token).join(replacement) : replacement;
    });

    element.value = output;
  }

  function updateTemplateFields(changedKey) {
    document.querySelectorAll("[data-template-source-key], [data-template-bindings]").forEach(function (element) {
      var bindings = getTemplateBindings(element);
      if (!changedKey || bindings.some(function (binding) { return binding.key === changedKey; })) {
        renderTemplateField(element);
      }
    });
  }

  function updateCompletionSections() {
    document.querySelectorAll("[data-complete-keys]").forEach(function (section) {
      var keys = (section.dataset.completeKeys || "").split(",").map(function (key) {
        return key.trim();
      }).filter(Boolean);
      var isReady = keys.length > 0 && keys.every(function (key) {
        return getStoredValue(key).trim();
      });
      var hint = section.querySelector("[data-completion-hint]");
      var button = section.querySelector("[data-completion-button]");
      var readyMessage = section.dataset.readyMessage || "Les productions sont remplies. Vous pouvez poursuivre.";
      var incompleteMessage = section.dataset.incompleteMessage || "Completez d'abord toutes les productions demandées.";

      if (hint) {
        hint.textContent = isReady ? readyMessage : incompleteMessage;
      }

      if (button) {
        button.setAttribute("aria-disabled", isReady ? "false" : "true");
        button.classList.toggle("is-disabled", !isReady);
      }
    });
  }

  function fallbackCopy(text) {
    var helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "true");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    helper.style.pointerEvents = "none";
    document.body.appendChild(helper);
    helper.select();
    helper.setSelectionRange(0, helper.value.length);
    var copied = false;

    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }

    document.body.removeChild(helper);
    return copied;
  }

  document.querySelectorAll("[data-storage-key]").forEach(function (element) {
    var key = element.dataset.storageKey;
    var storedValue = getStoredValue(key);
    var prefillKey = element.dataset.prefillFrom;

    if (storedValue) {
      element.value = storedValue;
    } else if (prefillKey) {
      element.value = getStoredValue(prefillKey);
    }

    element.addEventListener("input", function () {
      setStoredValue(key, element.value);
      updateReadOnlyFields(key, element.value);
      updateCompletionSections();
    });
  });

  document.querySelectorAll("[data-read-from]").forEach(function (element) {
    var sourceKey = element.dataset.readFrom;
    element.value = getStoredValue(sourceKey) || element.dataset.emptyMessage || "";
  });

  document.querySelectorAll("[data-template-source-key], [data-template-bindings]").forEach(function (element) {
    element.dataset.templateValue = element.value || "";
    renderTemplateField(element);
  });

  document.querySelectorAll("[data-fill-target]").forEach(function (button) {
    button.addEventListener("click", function () {
      var target = document.getElementById(button.dataset.fillTarget);
      var sourceKey = button.dataset.fillSourceKey;
      var sourceValue = getStoredValue(sourceKey);

      if (!target) {
        return;
      }

      target.value = sourceValue;
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.focus();
    });
  });

  document.querySelectorAll("[data-copy-target]").forEach(function (button) {
    button.addEventListener("click", function () {
      var target = document.getElementById(button.dataset.copyTarget);
      if (!target) {
        return;
      }

      var text = "value" in target ? target.value : target.textContent;
      var copyPromise;
      if (navigator.clipboard && window.isSecureContext) {
        copyPromise = navigator.clipboard.writeText(text);
      } else {
        copyPromise = fallbackCopy(text) ? Promise.resolve() : Promise.reject(new Error("copy failed"));
      }

      copyPromise.then(function () {
        var defaultLabel = button.dataset.defaultLabel || button.textContent;
        button.textContent = "Copie ok";
        setStatus("Le contenu a ete copie dans le presse-papiers.");
        window.setTimeout(function () {
          button.textContent = defaultLabel;
        }, 1400);
      }).catch(function () {
        setStatus("La copie automatique a echoue. Vous pouvez encore copier manuellement.");
      });
    });
  });

  window.addEventListener("storage", function (event) {
    if (!event.key) {
      return;
    }
    updateReadOnlyFields(event.key, event.newValue || "");
    updateTemplateFields(event.key);
    updateCompletionSections();
  });

  updateTemplateFields();
  updateCompletionSections();
  setStatus("Les champs de production se sauvegardent automatiquement sur ce navigateur.");
})();
