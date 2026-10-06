import ExpressionNode from "./ExpressionNode";
import Token from "../Token";

export default class FunctionNode extends ExpressionNode {
    name: Token;
    params: Token[];
    body: ExpressionNode;

    constructor(name: Token, params: Token[], body: ExpressionNode) {
        super();
        this.name = name;
        this.params = params;
        this.body = body;
    }
}