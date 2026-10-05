/* global importVariables, errorMessage, figma, __html__, inspectMangroveKit, createMangroveFocusDiagnostics, buildMangroveComponents, exportMangroveReview, prepareMangroveOverrideProbes, compareMangroveOverrideProbes, removeMangroveOverrideProbes, mgDiagnoseFontLoading, runMangroveCapabilityProbes, removeMangroveCapabilityProbes, refreshMangroveCapabilityProbeLedger, inspectMangroveCapabilityProbeLedger, prepareMangroveEditorialProbes, compareMangroveEditorialProbes, removeMangroveEditorialProbes, advanceMangroveSegmentedCanonicalProbes, advanceMangroveSegmentedLeavesProbes, advanceMangroveSegmentedWrapperProbes, advanceMangroveCoreContentProbes, organizeMangroveKit, navigateMangroveKit, createMangroveWelcome, inspectMangroveNavigation, navigateMangroveInstalled, refreshMangroveGuidance, readMangroveMaintenancePolicies, setMangroveMaintenancePolicy, preflightMangroveMaintenance */
/**
 * EXPLORATORY: imports mangrove-variables.json (written by
 * scripts/build-figma-tokens.cjs) into local Figma variables and styles.
 *
 * Re-running is an update, not a second copy: variables are matched by the
 * Mangrove token id stored in plugin data, then by name, so a token renamed
 * in YAML renames its Figma variable and keeps every binding to it.
 */
figma.showUI(__html__, { width: 600, height: 740, themeColors: true });

function post(type, payload) {
  figma.ui.postMessage(Object.assign({ type }, payload));
}

figma.ui.onmessage = async msg => {
  if (msg.type === 'close') {
    figma.closePlugin();
    return;
  }
  try {
    if (msg.type === 'kit-navigation-state') {
      let result;
      try {
        result = await inspectMangroveNavigation(msg.doc);
      } catch (error) {
        result = {
          destinations: [],
          families: [],
          errors: [errorMessage(error)],
        };
      }
      post('kit-navigation-state', { result });
      return;
    }
    if (msg.type === 'refresh-kit-guidance') {
      post('operation', { result: await refreshMangroveGuidance(msg.doc) });
      return;
    }
    if (msg.type === 'inspect') {
      post('inspection', {
        result: await inspectMangroveKit({
          checkFonts: msg.checkFonts === true,
        }),
      });
      return;
    }
    if (msg.type === 'diagnostics') {
      post('operation', {
        result: await createMangroveFocusDiagnostics(msg.doc, msg.brand),
      });
      return;
    }
    if (msg.type === 'read-maintenance-policy') {
      post('operation', {
        result: await readMangroveMaintenancePolicies(msg.doc, msg.families),
      });
      return;
    }
    if (msg.type === 'set-maintenance-policy') {
      post('operation', {
        result: await setMangroveMaintenancePolicy(
          msg.doc,
          msg.families,
          msg.owner,
          msg.reason
        ),
      });
      return;
    }
    if (msg.type === 'build-components') {
      try {
        await preflightMangroveMaintenance(msg.doc, msg.families);
      } catch (error) {
        post('operation', {
          result: {
            operation: 'component-build',
            phase: 'refused',
            createdNodeIds: [],
            updatedNodeIds: [],
            families: [],
            errors: [errorMessage(error)],
          },
        });
        return;
      }
      post('operation', {
        result: await buildMangroveComponents(
          msg.doc,
          msg.brand,
          msg.families,
          { refreshNarrowReview: msg.refreshNarrowReview ?? false }
        ),
      });
      return;
    }
    if (msg.type === 'organize-kit') {
      let result;
      try {
        result = await organizeMangroveKit(msg.doc, msg.brand, {
          compact: true,
        });
      } catch (error) {
        // The reconciler catches mutation failures itself. Thrown failures are
        // read-only preflight refusals and still need a downloadable receipt.
        result = {
          operation: 'kit-layout',
          version: '2',
          phase: 'refused',
          createdNodeIds: [],
          updatedNodeIds: [],
          errors: [error.message || String(error)],
        };
      }
      post('operation', { result });
      return;
    }
    if (msg.type === 'navigate-kit') {
      post('operation', {
        result: await navigateMangroveInstalled(msg.destination),
      });
      return;
    }
    if (msg.type === 'create-welcome') {
      let result;
      try {
        result = await createMangroveWelcome(msg.doc, msg.brand);
      } catch (error) {
        result = {
          operation: 'kit-welcome',
          phase: 'refused',
          createdNodeIds: [],
          updatedNodeIds: [],
          errors: [error.message || String(error)],
        };
      }
      post('operation', { result });
      return;
    }
    if (msg.type === 'prepare-override-probes') {
      post('operation', {
        result: await prepareMangroveOverrideProbes(
          msg.doc,
          msg.brand,
          msg.groupId
        ),
      });
      return;
    }
    if (msg.type === 'prepare-editorial-probes') {
      post('operation', {
        result: await prepareMangroveEditorialProbes(msg.doc, msg.brand),
      });
      return;
    }
    if (msg.type === 'compare-editorial-probes') {
      post('operation', {
        result: await compareMangroveEditorialProbes(
          msg.rootId,
          msg.buildResult
        ),
      });
      return;
    }
    if (msg.type === 'remove-editorial-probes') {
      post('operation', {
        result: await removeMangroveEditorialProbes(msg.rootId),
      });
      return;
    }
    if (msg.type === 'font-diagnostics') {
      const availableFonts = await figma.listAvailableFontsAsync();
      post('operation', {
        result: await mgDiagnoseFontLoading(msg.doc, {
          brandId: msg.brand,
          availableFonts,
        }),
      });
      return;
    }
    if (msg.type === 'capability-probes') {
      post('operation', {
        result: await runMangroveCapabilityProbes(
          msg.doc,
          msg.brand,
          msg.scope
        ),
      });
      return;
    }
    if (msg.type === 'advance-segmented-capability-probes') {
      post('operation', {
        result: await (
          msg.report?.scope === 'core-content'
            ? advanceMangroveCoreContentProbes
            : msg.report?.scope === 'segmented-wrapper'
              ? advanceMangroveSegmentedWrapperProbes
              : msg.report?.scope?.startsWith('segmented-leaves-')
                ? advanceMangroveSegmentedLeavesProbes
                : advanceMangroveSegmentedCanonicalProbes
        )(msg.doc, msg.brand, msg.report, msg.buildResult),
      });
      return;
    }
    if (msg.type === 'remove-capability-probes') {
      post('operation', {
        result: await removeMangroveCapabilityProbes(msg.report),
      });
      return;
    }
    if (msg.type === 'audit-capability-probes') {
      const reconciliation = await refreshMangroveCapabilityProbeLedger(
        msg.report
      );
      post('operation', {
        result: {
          ...msg.report,
          reconciliation,
          errors: reconciliation.errors,
        },
      });
      return;
    }
    if (msg.type === 'inspect-capability-probes') {
      post('operation', {
        result: await inspectMangroveCapabilityProbeLedger(msg.report),
      });
      return;
    }
    if (msg.type === 'compare-override-probes') {
      post('operation', {
        result: await compareMangroveOverrideProbes(
          msg.rootId,
          msg.buildResult
        ),
      });
      return;
    }
    if (msg.type === 'remove-override-probes') {
      post('operation', {
        result: await removeMangroveOverrideProbes(msg.rootId),
      });
      return;
    }
    if (msg.type === 'export-review') {
      post('export', {
        result: await exportMangroveReview(msg.name, {
          scale: 2,
          familyId: msg.familyId,
        }),
      });
      return;
    }
    if (msg.type !== 'import') return;
    const result = await importVariables(
      msg.doc,
      msg.modes,
      msg.prune,
      msg.textStyles,
      msg.effects
    );
    post('result', { result });
    figma.notify(
      `Mangrove variables: ${result.counts.created} created, ` +
        `${result.counts.updated} updated. See the plugin report for styles` +
        (result.errors.length ? `, ${result.errors.length} errors` : '')
    );
  } catch (error) {
    post('error', { message: errorMessage(error) });
  }
};
