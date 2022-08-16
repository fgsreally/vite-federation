describe("remote federation test", () => {
  it("remote component build success(远程组件成功生成)(develop)", () => {
    cy.visit("http://localhost:3000");
    cy.get(".el-tree-node").should("be.exist");
  });

  it("remote css build success(远程样式传递)(develop)", async () => {
    cy.get(".el-tree").should(($div) => {
      expect(Number($div.css("backgroundColor"))).to.equal("red");
    });
  });
  it("remote component build success(远程组件成功生成)(build)", () => {
    cy.visit("http://localhost:4173");
    cy.get(".el-tree-node").should("be.exist");
  });

  it("remote css build success(远程样式传递)(build)", async () => {
    cy.get(".el-tree").should(($div) => {
      expect(Number($div.css("backgroundColor"))).to.equal("red");
    });
  });
});
