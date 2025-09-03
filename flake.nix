{
  description = "Simple dev env for eliximap";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs";

  outputs = { self, nixpkgs, ... }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
    in {
      devShells.${system}.default = pkgs.mkShell {
        buildInputs = with pkgs; [
          webkitgtk_4_1
          librsvg
          rustc
          cargo
          bun
          nodejs_22
          pkg-config
          gtk3
        ];
      };
    };
}
