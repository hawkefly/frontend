import "@polymer/paper-item/paper-item";
import "@polymer/paper-listbox/paper-listbox";
import "@polymer/paper-input/paper-input";

import {
  css,
  CSSResult,
  html,
  LitElement,
  property,
  TemplateResult,
  customElement,
  query,
} from "lit-element";
import { computeRTLDirection } from "../../../common/util/compute_rtl";
import { HomeAssistant, MediaEntity } from "../../../types";
import { supportsFeature } from "../../../common/entity/supports-feature";
import { UNAVAILABLE_STATES, UNAVAILABLE, UNKNOWN } from "../../../data/entity";
import {
  SUPPORT_TURN_ON,
  SUPPORT_TURN_OFF,
  SUPPORTS_PLAY,
  SUPPORT_PREVIOUS_TRACK,
  SUPPORT_PAUSE,
  SUPPORT_STOP,
  SUPPORT_NEXT_TRACK,
  SUPPORT_VOLUME_MUTE,
  SUPPORT_VOLUME_SET,
  SUPPORT_VOLUME_BUTTONS,
  SUPPORT_SELECT_SOURCE,
  SUPPORT_SELECT_SOUND_MODE,
  SUPPORT_PLAY_MEDIA,
  ControlButton,
} from "../../../data/media-player";
import { isComponentLoaded } from "../../../common/config/is_component_loaded";

import "../../../components/ha-paper-dropdown-menu";
import "../../../components/ha-icon-button";
import "../../../components/ha-slider";
import "../../../components/ha-icon";

@customElement("more-info-media_player")
class MoreInfoMediaPlayer extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public stateObj?: MediaEntity;

  @query("#ttsInput") private _ttsInput?: HTMLInputElement;

  protected render(): TemplateResult {
    if (!this.stateObj) {
      return html``;
    }

    const controls = this._getControls();
    const stateObj = this.stateObj;

    return html`
      ${!controls
        ? ""
        : html`
            <div class="controls">
              ${controls!.map(
                (control) => html`
                  <ha-icon-button
                    action=${control.action}
                    .icon=${control.icon}
                    @click=${this._handleClick}
                  ></ha-icon-button>
                `
              )}
            </div>
          `}
      ${(supportsFeature(stateObj, SUPPORT_VOLUME_SET) ||
        supportsFeature(stateObj, SUPPORT_VOLUME_BUTTONS)) &&
      ![UNAVAILABLE, UNKNOWN, "off"].includes(stateObj.state)
        ? html`
            <div class="volume">
              ${supportsFeature(stateObj, SUPPORT_VOLUME_MUTE)
                ? html`
                    <ha-icon-button
                      .icon=${stateObj.attributes.is_volume_muted
                        ? "hass:volume-off"
                        : "hass:volume-high"}
                      @click=${this._toggleMute}
                    ></ha-icon-button>
                  `
                : ""}
              ${supportsFeature(stateObj, SUPPORT_VOLUME_SET)
                ? html`
                    <ha-slider
                      id="input"
                      pin
                      ignore-bar-touch
                      .dir=${computeRTLDirection(this.hass!)}
                      .value=${Number(stateObj.attributes.volume_level) * 100}
                      @change=${this._selectedValueChanged}
                    ></ha-slider>
                  `
                : supportsFeature(stateObj, SUPPORT_VOLUME_BUTTONS)
                ? html`
                    <ha-icon-button
                      action="volume_down"
                      icon="hass:volume-minus"
                      @click=${this._handleClick}
                    ></ha-icon-button>
                    <ha-icon-button
                      action="volume_up"
                      icon="hass:volume-plus"
                      @click=${this._handleClick}
                    ></ha-icon-button>
                  `
                : ""}
            </div>
          `
        : ""}
      ${stateObj.state !== "off" &&
      supportsFeature(stateObj, SUPPORT_SELECT_SOURCE) &&
      stateObj.attributes.source_list?.length
        ? html`
            <div class="source-input">
              <ha-icon class="source-input" icon="hass:login-variant"></ha-icon>
              <ha-paper-dropdown-menu
                .label=${this.hass.localize("ui.card.media_player.source")}
              >
                <paper-listbox
                  slot="dropdown-content"
                  attr-for-selected="item-name"
                  .selected=${stateObj.attributes.source!}
                  @iron-select=${this._handleSourceChanged}
                >
                  ${stateObj.attributes.source_list!.map(
                    (source) =>
                      html`
                        <paper-item .itemName=${source}>${source}</paper-item>
                      `
                  )}
                </paper-listbox>
              </ha-paper-dropdown-menu>
            </div>
          `
        : ""}
      ${supportsFeature(stateObj, SUPPORT_SELECT_SOUND_MODE) &&
      stateObj.attributes.sound_mode_list?.length
        ? html`
            <div class="sound-input">
              <ha-icon icon="hass:music-note"></ha-icon>
              <ha-paper-dropdown-menu
                dynamic-align
                label-float
                .label=${this.hass.localize("ui.card.media_player.sound_mode")}
              >
                <paper-listbox
                  slot="dropdown-content"
                  attr-for-selected="item-name"
                  .selected=${stateObj.attributes.sound_mode!}
                  @iron-select=${this._handleSoundModeChanged}
                >
                  ${stateObj.attributes.sound_mode_list.map(
                    (mode) => html`
                      <paper-item itemName=${mode}>${mode}</paper-item>
                    `
                  )}
                </paper-listbox>
              </ha-paper-dropdown-menu>
            </div>
          `
        : ""}
      ${isComponentLoaded(this.hass, "tts") &&
      supportsFeature(stateObj, SUPPORT_PLAY_MEDIA)
        ? html`
            <div class="tts">
              <paper-input
                id="ttsInput"
                .label=${this.hass.localize(
                  "ui.card.media_player.text_to_speak"
                )}
                @keydown=${this._ttsCheckForEnter}
              ></paper-input>
              <ha-icon-button icon="hass:send" @click=${
                this._sendTTS
              }></ha-icon-button>
            </div>
          </div>
          `
        : ""}
    `;
  }

  static get styles(): CSSResult {
    return css`
      ha-icon-button[action="turn_off"],
      ha-icon-button[action="turn_on"],
      ha-slider,
      #ttsInput {
        flex-grow: 1;
      }

      .volume,
      .controls,
      .source-input,
      .sound-input,
      .tts {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .source-input ha-icon,
      .sound-input ha-icon {
        padding: 7px;
        margin-top: 24px;
      }

      .source-input ha-paper-dropdown-menu,
      .sound-input ha-paper-dropdown-menu {
        margin-left: 10px;
        flex-grow: 1;
      }

      paper-item {
        cursor: pointer;
      }
    `;
  }

  private _getControls(): ControlButton[] | undefined {
    const stateObj = this.stateObj;

    if (!stateObj) {
      return undefined;
    }

    const state = stateObj.state;

    if (UNAVAILABLE_STATES.includes(state)) {
      return undefined;
    }

    if (state === "off") {
      return supportsFeature(stateObj, SUPPORT_TURN_ON)
        ? [
            {
              icon: "hass:power",
              action: "turn_on",
            },
          ]
        : undefined;
    }

    if (state === "idle") {
      return supportsFeature(stateObj, SUPPORTS_PLAY)
        ? [
            {
              icon: "hass:play",
              action: "media_play",
            },
          ]
        : undefined;
    }

    const buttons: ControlButton[] = [];

    if (supportsFeature(stateObj, SUPPORT_TURN_OFF)) {
      buttons.push({
        icon: "hass:power",
        action: "turn_off",
      });
    }

    if (supportsFeature(stateObj, SUPPORT_PREVIOUS_TRACK)) {
      buttons.push({
        icon: "hass:skip-previous",
        action: "media_previous_track",
      });
    }

    if (
      (state === "playing" &&
        (supportsFeature(stateObj, SUPPORT_PAUSE) ||
          supportsFeature(stateObj, SUPPORT_STOP))) ||
      (state === "paused" && supportsFeature(stateObj, SUPPORTS_PLAY))
    ) {
      buttons.push({
        icon:
          state !== "playing"
            ? "hass:play"
            : supportsFeature(stateObj, SUPPORT_PAUSE)
            ? "hass:pause"
            : "hass:stop",
        action: "media_play_pause",
      });
    }

    if (supportsFeature(stateObj, SUPPORT_NEXT_TRACK)) {
      buttons.push({
        icon: "hass:skip-next",
        action: "media_next_track",
      });
    }

    return buttons.length > 0 ? buttons : undefined;
  }

  private _handleClick(e: MouseEvent): void {
    this.hass!.callService(
      "media_player",
      (e.currentTarget! as HTMLElement).getAttribute("action")!,
      {
        entity_id: this.stateObj!.entity_id,
      }
    );
  }

  private _toggleMute() {
    this.hass!.callService("media_player", "volume_mute", {
      entity_id: this.stateObj!.entity_id,
      is_volume_muted: !this.stateObj!.attributes.is_volume_muted,
    });
  }

  private _selectedValueChanged(e: Event): void {
    this.hass!.callService("media_player", "volume_set", {
      entity_id: this.stateObj!.entity_id,
      volume_level:
        Number((e.currentTarget! as HTMLElement).getAttribute("value")!) / 100,
    });
  }

  private _handleSourceChanged(e: CustomEvent) {
    const newVal = e.detail.value;

    if (!newVal || this.stateObj!.attributes.source === newVal) return;

    this.hass.callService("media_player", "select_source", {
      source: newVal,
    });
  }

  private _handleSoundModeChanged(e: CustomEvent) {
    const newVal = e.detail.value;

    if (!newVal || this.stateObj?.attributes.sound_mode === newVal) return;

    this.hass.callService("media_player", "select_sound_mode", {
      sound_mode: newVal,
    });
  }

  private _ttsCheckForEnter(e: KeyboardEvent) {
    if (e.keyCode === 13) this._sendTTS();
  }

  private _sendTTS() {
    const ttsInput = this._ttsInput;
    if (!ttsInput) {
      return;
    }

    const services = this.hass.services.tts;
    const serviceKeys = Object.keys(services).sort();

    const service = serviceKeys.find((key) => key.indexOf("_say") !== -1);

    if (!service) {
      return;
    }

    this.hass.callService("tts", service, {
      entity_id: this.stateObj!.entity_id,
      message: ttsInput.value,
    });
    ttsInput.value = "";
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "more-info-media_player": MoreInfoMediaPlayer;
  }
}
