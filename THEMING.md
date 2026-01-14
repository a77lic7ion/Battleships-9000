# Battleships 9000 Theming Guidelines

This document outlines the specifications for creating new visual themes for Battleships 9000.

## General Principles

*   **Style:** Each theme should have a distinct and consistent art style. Whether it's pixel art, vector illustration, or another style, all assets within a theme should feel cohesive.
*   **Format:** All assets should be in **PNG** format with transparent backgrounds to ensure they can be easily layered over different backgrounds.

## Asset Breakdown

### 1. Ship Sprites

Ship sprites are the most important assets in the game. They are displayed on the grid and represent the player's and opponent's fleets.

*   **Dimensions:** Each ship sprite should be composed of **32x32 pixel** tiles. The total image size will vary based on the ship's length.
    *   **Patrol Boat (2 blocks):** 64x32 pixels
    *   **Submarine (3 blocks):** 96x32 pixels
    *   **Destroyer (3 blocks):** 96x32 pixels
    *   **Battleship (4 blocks):** 128x32 pixels
    *   **Carrier (5 blocks):** 160x32 pixels
*   **Versions:** Each ship requires two versions: one for horizontal placement and one for vertical placement.
*   **File Naming:** `ship_[ship_name]_[h|v].png` (e.g., `ship_carrier_h.png`)

### 2. Power-Up Icons

These icons appear in the UI and represent the three power-ups. They should be easily recognizable at a small size.

*   **Dimensions:** **64x64 pixels**
*   **Required Icons:**
    *   Aegis Shield
    *   Sonar Scan
    *   Trident Missile
*   **File Naming:** `powerup_[powerup_name].png` (e.g., `powerup_shield.png`)

### 3. UI Icons

These are smaller icons used throughout the game's interface.

*   **Coin Icon:**
    *   **Dimensions:** **24x24 pixels**
    *   **File Naming:** `icon_coin.png`
*   **Player Avatars:**
    *   **Dimensions:** **128x128 pixels**
    *   **File Naming:** `avatar_[theme_name].png` (e.g., `avatar_steampunk.png`)

### 4. Backgrounds

The background image sets the overall mood and theme for the game.

*   **Dimensions:** **1920x1080 pixels**
*   **File Naming:** `background.png`

## Theme Directory Structure

All assets for a theme should be placed in a dedicated directory within the `public/themes/` directory. For example, a "steampunk" theme would have the following structure:

```
public/
└── themes/
    └── steampunk/
        ├── background.png
        ├── ship_carrier_h.png
        ├── ship_carrier_v.png
        ├── ... (all other ship sprites)
```

## Example Themes

Here are some ideas for themes to get you started:

*   **Futuristic:** The default theme. Sleek, minimalist ships with glowing blue accents.
*   **Steampunk:** Ornate, brass-plated ships with visible gears and steam pipes. The background could be a cluttered workshop.
*   **Vintage Pirate:** Wooden sailing ships with cannons and Jolly Roger flags. The background could be an old treasure map.
*   **Modern Warships:** Realistic depictions of modern naval vessels. The background could be the open ocean.
